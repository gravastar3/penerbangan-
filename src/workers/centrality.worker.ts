// Centrality Web Worker
// This worker handles heavy centrality calculations off the main thread

interface CentralityMetrics {
  degree: number;
  betweenness: number;
  closeness: number;
}

interface AirportCentrality {
  code: string;
  name: string;
  metrics: CentralityMetrics;
  rank: {
    degree: number;
    betweenness: number;
    closeness: number;
    overall: number;
  };
}

interface NetworkAnalysisResult {
  airports: AirportCentrality[];
  topHubs: AirportCentrality[];
  networkStats: {
    totalNodes: number;
    totalEdges: number;
    averageDegree: number;
    density: number;
  };
}

interface WorkerMessage {
  type: 'CALCULATE_CENTRALITY';
  payload: {
    routes: Array<{ from: string; to: string; distance: number }>;
    airports: Array<{ code: string; name: string }>;
  };
}

class CentralityWorker {
  private graph: Map<string, { neighbors: string[]; distances: Map<string, number> }>;
  private airportNames: Map<string, string>;

  constructor() {
    this.graph = new Map();
    this.airportNames = new Map();
  }

  private buildGraph(routes: Array<{ from: string; to: string; distance: number }>) {
    routes.forEach(route => {
      if (!this.graph.has(route.from)) {
        this.graph.set(route.from, { neighbors: [], distances: new Map() });
      }
      if (!this.graph.has(route.to)) {
        this.graph.set(route.to, { neighbors: [], distances: new Map() });
      }

      const fromNode = this.graph.get(route.from)!;
      const toNode = this.graph.get(route.to)!;

      if (!fromNode.neighbors.includes(route.to)) {
        fromNode.neighbors.push(route.to);
        fromNode.distances.set(route.to, route.distance);
      }
      
      if (!toNode.neighbors.includes(route.from)) {
        toNode.neighbors.push(route.from);
        toNode.distances.set(route.from, route.distance);
      }
    });
  }

  private calculateDegreeCentrality(node: string): number {
    const neighbors = this.graph.get(node)?.neighbors || [];
    return neighbors.length;
  }

  private calculateBetweennessCentrality(node: string): number {
    const nodes = Array.from(this.graph.keys());
    let betweenness = 0;

    // Optimized: Use Brandes' algorithm for better performance
    const S: string[][] = [];
    const P: Map<string, string[]> = new Map();
    const sigma: Map<string, number> = new Map();
    const d: Map<string, number> = new Map();
    const delta: Map<string, number> = new Map();

    nodes.forEach(s => {
      // Initialize data structures for source s
      S.length = 0;
      P.clear();
      sigma.clear();
      d.clear();
      delta.clear();
      
      nodes.forEach(t => {
        P.set(t, []);
        sigma.set(t, 0);
        d.set(t, -1);
        delta.set(t, 0);
      });
      
      sigma.set(s, 1);
      d.set(s, 0);
      
      const Q: string[] = [s];
      
      while (Q.length > 0) {
        const v = Q.shift()!;
        S.push(v);
        
        const neighbors = this.graph.get(v)?.neighbors || [];
        neighbors.forEach(w => {
          if (d.get(w)! === -1) {
            d.set(w, d.get(v)! + 1);
            Q.push(w);
          }
          
          if (d.get(w)! === d.get(v)! + 1) {
            sigma.set(w, sigma.get(w)! + sigma.get(v)!);
            P.get(w)!.push(v);
          }
        });
      }
      
      // Delta calculation
      while (S.length > 0) {
        const w = S.pop()!;
        const predecessors = P.get(w) || [];
        
        predecessors.forEach(v => {
          const c = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
          delta.set(v, delta.get(v)! + c);
        });
        
        if (w !== node) {
          betweenness += delta.get(w)!;
        }
      }
    });

    // Normalize for undirected graph
    const n = nodes.length;
    if (n > 2) {
      betweenness = betweenness / ((n - 1) * (n - 2) / 2);
    }

    return betweenness;
  }

  private calculateClosenessCentrality(node: string): number {
    const nodes = Array.from(this.graph.keys());
    const distances = this.calculateShortestDistances(node);
    
    let totalDistance = 0;
    let reachableNodes = 0;

    for (const target of nodes) {
      if (target !== node && distances.has(target) && distances.get(target)! < Infinity) {
        totalDistance += distances.get(target)!;
        reachableNodes++;
      }
    }

    if (reachableNodes === 0) return 0;
    return reachableNodes / totalDistance;
  }

  private calculateShortestDistances(source: string): Map<string, number> {
    const distances = new Map<string, number>();
    const visited = new Set<string>();
    const queue: { node: string; distance: number }[] = [];

    this.graph.forEach((_, node) => {
      distances.set(node, node === source ? 0 : Infinity);
      queue.push({ node, distance: node === source ? 0 : Infinity });
    });

    while (queue.length > 0) {
      queue.sort((a, b) => a.distance - b.distance);
      const current = queue.shift()!;
      
      if (visited.has(current.node)) continue;
      visited.add(current.node);

      const neighbors = this.graph.get(current.node);
      if (!neighbors) continue;

      for (const neighbor of neighbors.neighbors) {
        if (visited.has(neighbor)) continue;

        const edgeDistance = neighbors.distances.get(neighbor) || 1;
        const newDistance = current.distance + edgeDistance;

        if (newDistance < distances.get(neighbor)!) {
          distances.set(neighbor, newDistance);
          
          const queueItem = queue.find(item => item.node === neighbor);
          if (queueItem) {
            queueItem.distance = newDistance;
          }
        }
      }
    }

    return distances;
  }

  private calculateRanks(airportCentralities: AirportCentrality[]) {
    const sortByDegree = [...airportCentralities].sort((a, b) => b.metrics.degree - a.metrics.degree);
    const sortByBetweenness = [...airportCentralities].sort((a, b) => b.metrics.betweenness - a.metrics.betweenness);
    const sortByCloseness = [...airportCentralities].sort((a, b) => b.metrics.closeness - a.metrics.closeness);

    airportCentralities.forEach(airport => {
      airport.rank.degree = sortByDegree.findIndex(a => a.code === airport.code) + 1;
      airport.rank.betweenness = sortByBetweenness.findIndex(a => a.code === airport.code) + 1;
      airport.rank.closeness = sortByCloseness.findIndex(a => a.code === airport.code) + 1;
      airport.rank.overall = (airport.rank.degree + airport.rank.betweenness + airport.rank.closeness) / 3;
    });
  }

  private calculateNetworkStats() {
    const nodes = Array.from(this.graph.keys());
    const totalNodes = nodes.length;
    
    let totalEdges = 0;
    let totalDegree = 0;

    this.graph.forEach(node => {
      totalEdges += node.neighbors.length;
      totalDegree += node.neighbors.length;
    });

    totalEdges = totalEdges / 2;
    const averageDegree = totalDegree / totalNodes;
    const density = totalNodes > 1 ? (2 * totalEdges) / (totalNodes * (totalNodes - 1)) : 0;

    return {
      totalNodes,
      totalEdges,
      averageDegree,
      density
    };
  }

  public calculateNetworkCentrality(routes: Array<{ from: string; to: string; distance: number }>, airports: Array<{ code: string; name: string }>): NetworkAnalysisResult {
    // Reset and rebuild
    this.graph.clear();
    this.airportNames.clear();
    
    airports.forEach(airport => {
      this.airportNames.set(airport.code, airport.name);
    });
    
    this.buildGraph(routes);

    const nodes = Array.from(this.graph.keys());
    const airportCentralities: AirportCentrality[] = [];

    // Calculate centrality for each node
    nodes.forEach(node => {
      const degree = this.calculateDegreeCentrality(node);
      const betweenness = this.calculateBetweennessCentrality(node);
      const closeness = this.calculateClosenessCentrality(node);

      airportCentralities.push({
        code: node,
        name: this.airportNames.get(node) || node,
        metrics: {
          degree,
          betweenness,
          closeness
        },
        rank: {
          degree: 0,
          betweenness: 0,
          closeness: 0,
          overall: 0
        }
      });
    });

    this.calculateRanks(airportCentralities);

    const topHubs = [...airportCentralities]
      .sort((a, b) => a.rank.overall - b.rank.overall)
      .slice(0, 5);

    const networkStats = this.calculateNetworkStats();

    return {
      airports: airportCentralities,
      topHubs,
      networkStats
    };
  }
}

// Handle messages from main thread
self.onmessage = function(event: MessageEvent<WorkerMessage>) {
  const { type, payload } = event.data;
  
  if (type === 'CALCULATE_CENTRALITY') {
    try {
      const worker = new CentralityWorker();
      const result = worker.calculateNetworkCentrality(payload.routes, payload.airports);
      
      // Send result back to main thread
      self.postMessage({
        type: 'CENTRALITY_RESULT',
        payload: result,
        success: true
      });
    } catch (error) {
      // Send error back to main thread
      self.postMessage({
        type: 'CENTRALITY_ERROR',
        payload: { error: error instanceof Error ? error.message : 'Unknown error' },
        success: false
      });
    }
  }
};