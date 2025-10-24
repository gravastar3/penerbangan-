interface CentralityMetrics {
  degree: number;
  betweenness: number;
  closeness: number;
  eigenvector?: number;
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
    diameter?: number;
    averagePathLength?: number;
  };
}

export class CentralityAnalyzer {
  private graph: Map<string, { neighbors: string[]; distances: Map<string, number> }>;
  private airportNames: Map<string, string>;

  constructor(routes: Array<{ from: string; to: string; distance: number }>, airports: Array<{ code: string; name: string }>) {
    this.graph = new Map();
    this.airportNames = new Map();
    
    // Initialize airport names
    airports.forEach(airport => {
      this.airportNames.set(airport.code, airport.name);
    });

    this.buildGraph(routes);
  }

  private buildGraph(routes: Array<{ from: string; to: string; distance: number }>) {
    // Create adjacency list with distances
    routes.forEach(route => {
      if (!this.graph.has(route.from)) {
        this.graph.set(route.from, { neighbors: [], distances: new Map() });
      }
      if (!this.graph.has(route.to)) {
        this.graph.set(route.to, { neighbors: [], distances: new Map() });
      }

      const fromNode = this.graph.get(route.from)!;
      const toNode = this.graph.get(route.to)!;

      // Add edge in both directions (undirected graph)
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

  // Calculate Degree Centrality
  private calculateDegreeCentrality(node: string): number {
    const neighbors = this.graph.get(node)?.neighbors || [];
    return neighbors.length;
  }

  // Calculate Betweenness Centrality using Brandes' algorithm
  private calculateBetweennessCentrality(node: string): number {
    const nodes = Array.from(this.graph.keys());
    let betweenness = 0;

    for (const source of nodes) {
      if (source === node) continue;

      for (const target of nodes) {
        if (target === node || target === source) continue;

        const shortestPaths = this.findAllShortestPaths(source, target);
        const totalPaths = shortestPaths.length;
        
        if (totalPaths === 0) continue;

        const pathsThroughNode = shortestPaths.filter(path => 
          path.includes(node)
        ).length;

        betweenness += pathsThroughNode / totalPaths;
      }
    }

    // Normalize by (n-1)(n-2) for undirected graphs
    const n = nodes.length;
    if (n > 2) {
      betweenness = betweenness / ((n - 1) * (n - 2) / 2);
    }

    return betweenness;
  }

  // Find all shortest paths between two nodes
  private findAllShortestPaths(source: string, target: string): string[][] {
    const queue: { node: string; path: string[]; distance: number }[] = [];
    const visited = new Set<string>();
    const shortestPaths: string[][] = [];
    let shortestDistance = Infinity;

    queue.push({ node: source, path: [source], distance: 0 });

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.node === target) {
        if (current.distance < shortestDistance) {
          shortestDistance = current.distance;
          shortestPaths.length = 0; // Clear previous paths
          shortestPaths.push(current.path);
        } else if (current.distance === shortestDistance) {
          shortestPaths.push(current.path);
        }
        continue;
      }

      if (current.distance > shortestDistance) {
        continue;
      }

      if (visited.has(current.node)) {
        continue;
      }

      visited.add(current.node);

      const neighbors = this.graph.get(current.node);
      if (!neighbors) continue;

      for (const neighbor of neighbors.neighbors) {
        if (!visited.has(neighbor)) {
          const edgeDistance = neighbors.distances.get(neighbor) || 1;
          queue.push({
            node: neighbor,
            path: [...current.path, neighbor],
            distance: current.distance + edgeDistance
          });
        }
      }
    }

    return shortestPaths;
  }

  // Calculate Closeness Centrality
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

    // Closeness = (n-1) / sum of distances to all other nodes
    const closeness = (reachableNodes) / totalDistance;
    return closeness;
  }

  // Calculate shortest distances from a node to all other nodes using Dijkstra
  private calculateShortestDistances(source: string): Map<string, number> {
    const distances = new Map<string, number>();
    const visited = new Set<string>();
    const queue: { node: string; distance: number }[] = [];

    // Initialize distances
    this.graph.forEach((_, node) => {
      distances.set(node, node === source ? 0 : Infinity);
      queue.push({ node, distance: node === source ? 0 : Infinity });
    });

    while (queue.length > 0) {
      // Sort queue by distance and get the minimum
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
          
          // Update queue
          const queueItem = queue.find(item => item.node === neighbor);
          if (queueItem) {
            queueItem.distance = newDistance;
          }
        }
      }
    }

    return distances;
  }

  // Calculate all centrality metrics for all nodes
  public calculateNetworkCentrality(): NetworkAnalysisResult {
    const nodes = Array.from(this.graph.keys());
    const airportCentralities: AirportCentrality[] = [];

    console.log(`[DEBUG] Calculating centrality for ${nodes.length} nodes`);

    // Calculate centrality for each node
    nodes.forEach(node => {
      console.log(`[DEBUG] Processing node: ${node}`);
      
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

    // Calculate ranks
    this.calculateRanks(airportCentralities);

    // Get top hubs (top 5 by overall rank)
    const topHubs = [...airportCentralities]
      .sort((a, b) => a.rank.overall - b.rank.overall)
      .slice(0, 5);

    // Calculate network statistics
    const networkStats = this.calculateNetworkStats();

    return {
      airports: airportCentralities,
      topHubs,
      networkStats
    };
  }

  // Calculate ranks for each centrality metric
  private calculateRanks(airportCentralities: AirportCentrality[]) {
    // Sort by each metric and assign ranks
    const sortByDegree = [...airportCentralities].sort((a, b) => b.metrics.degree - a.metrics.degree);
    const sortByBetweenness = [...airportCentralities].sort((a, b) => b.metrics.betweenness - a.metrics.betweenness);
    const sortByCloseness = [...airportCentralities].sort((a, b) => b.metrics.closeness - a.metrics.closeness);

    airportCentralities.forEach((airport, index) => {
      airport.rank.degree = sortByDegree.findIndex(a => a.code === airport.code) + 1;
      airport.rank.betweenness = sortByBetweenness.findIndex(a => a.code === airport.code) + 1;
      airport.rank.closeness = sortByCloseness.findIndex(a => a.code === airport.code) + 1;
      
      // Calculate overall rank (average of individual ranks)
      airport.rank.overall = (airport.rank.degree + airport.rank.betweenness + airport.rank.closeness) / 3;
    });
  }

  // Calculate basic network statistics
  private calculateNetworkStats() {
    const nodes = Array.from(this.graph.keys());
    const totalNodes = nodes.length;
    
    let totalEdges = 0;
    let totalDegree = 0;

    this.graph.forEach(node => {
      totalEdges += node.neighbors.length;
      totalDegree += node.neighbors.length;
    });

    // Divide by 2 since each edge is counted twice in undirected graph
    totalEdges = totalEdges / 2;
    const averageDegree = totalDegree / totalNodes;
    
    // Density = 2 * |E| / (|V| * (|V| - 1))
    const density = totalNodes > 1 ? (2 * totalEdges) / (totalNodes * (totalNodes - 1)) : 0;

    return {
      totalNodes,
      totalEdges,
      averageDegree,
      density
    };
  }

  // Get centrality data for visualization
  public getVisualizationData() {
    const analysis = this.calculateNetworkCentrality();
    
    return {
      nodes: analysis.airports.map(airport => ({
        id: airport.code,
        name: airport.name,
        degree: airport.metrics.degree,
        betweenness: airport.metrics.betweenness,
        closeness: airport.metrics.closeness,
        overallRank: airport.rank.overall,
        // Size for visualization (normalize to reasonable range)
        size: Math.max(5, Math.min(30, 5 + airport.metrics.degree * 2)),
        // Color based on betweenness centrality
        colorIntensity: airport.metrics.betweenness
      })),
      edges: this.getEdgesForVisualization(),
      stats: analysis.networkStats,
      topHubs: analysis.topHubs
    };
  }

  // Get edge data for visualization
  private getEdgesForVisualization() {
    const edges: Array<{ from: string; to: string; weight: number }> = [];
    const processedPairs = new Set<string>();

    this.graph.forEach((node, fromNode) => {
      node.neighbors.forEach(toNode => {
        const pairKey = [fromNode, toNode].sort().join('-');
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          edges.push({
            from: fromNode,
            to: toNode,
            weight: node.distances.get(toNode) || 1
          });
        }
      });
    });

    return edges;
  }
}