interface Route {
  from: string;
  to: string;
  airline: string;
  distance: number;
  speed?: number; // kecepatan maskapai dalam km/jam
}

interface GraphNode {
  code: string;
  neighbors: { code: string; distance: number; airline: string; speed: number }[];
}

interface Airport {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}

export class RouteFinder {
  private graph: Map<string, GraphNode> = new Map();
  private airlineSpeeds: Map<string, number> = new Map();
  private airports: Airport[] = [];

  constructor(routes: Route[], airlineSpeeds: Record<string, number> = {}, airports: Airport[] = []) {
    // Set airline speeds
    Object.entries(airlineSpeeds).forEach(([airline, speed]) => {
      this.airlineSpeeds.set(airline, speed);
    });
    
    this.airports = airports;
    this.buildGraph(routes);
  }

  private buildGraph(routes: Route[]) {
    // Create nodes for each unique airport
    const uniqueAirports = new Set<string>();
    routes.forEach(route => {
      uniqueAirports.add(route.from);
      uniqueAirports.add(route.to);
    });

    // Initialize graph nodes
    uniqueAirports.forEach(airportCode => {
      this.graph.set(airportCode, {
        code: airportCode,
        neighbors: []
      });
    });

    // Add edges (routes)
    routes.forEach(route => {
      const fromNode = this.graph.get(route.from);
      const toNode = this.graph.get(route.to);

      if (fromNode && toNode) {
        // Get speed for this airline, default to 800 km/h if not found
        const speed = route.speed || this.airlineSpeeds.get(route.airline) || 800;
        
        // Use real distance calculation if airports data is available
        let distance = route.distance;
        if (this.airports.length > 0) {
          const fromAirport = this.airports.find(a => a.code === route.from);
          const toAirport = this.airports.find(a => a.code === route.to);
          if (fromAirport && toAirport) {
            distance = this.calculateDistance(fromAirport, toAirport);
          }
        }
        
        // Add route in both directions (assuming flights can go both ways)
        fromNode.neighbors.push({
          code: route.to,
          distance,
          airline: route.airline,
          speed
        });

        toNode.neighbors.push({
          code: route.from,
          distance,
          airline: route.airline,
          speed
        });
      }
    });
  }

  // Haversine distance calculation
  private calculateDistance(airport1: Airport, airport2: Airport): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(airport2.latitude - airport1.latitude);
    const dLon = this.deg2rad(airport2.longitude - airport1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(airport1.latitude)) * Math.cos(this.deg2rad(airport2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Get detailed segment information for the path
  public getPathSegments(path: string[]): Array<{
    from: string;
    to: string;
    distance: number;
    fromName: string;
    toName: string;
    airline: string;
  }> {
    const segments: Array<{
      from: string;
      to: string;
      distance: number;
      fromName: string;
      toName: string;
      airline: string;
    }> = [];

    for (let i = 0; i < path.length - 1; i++) {
      const fromCode = path[i];
      const toCode = path[i + 1];
      
      const fromAirport = this.airports.find(a => a.code === fromCode);
      const toAirport = this.airports.find(a => a.code === toCode);
      
      if (fromAirport && toAirport) {
        const distance = this.calculateDistance(fromAirport, toAirport);
        
        // Find the airline for this route
        const fromNode = this.graph.get(fromCode);
        const route = fromNode?.neighbors.find(n => n.code === toCode);
        
        segments.push({
          from: fromCode,
          to: toCode,
          distance,
          fromName: fromAirport.name,
          toName: toAirport.name,
          airline: route?.airline || 'Unknown'
        });
      }
    }

    return segments;
  }

  public findShortestPath(start: string, end: string): {
    path: string[];
    totalDistance: number;
    airlines: string[];
    totalTime: number; // in minutes
    segments?: Array<{
      from: string;
      to: string;
      distance: number;
      fromName: string;
      toName: string;
      airline: string;
    }>;
  } | null {
    console.log(`[DEBUG] Finding shortest path from ${start} to ${end}`);
    
    if (!this.graph.has(start) || !this.graph.has(end)) {
      console.log(`[DEBUG] Start or end node not found in graph`);
      return null;
    }

    if (start === end) {
      console.log(`[DEBUG] Start and end are the same`);
      return {
        path: [start],
        totalDistance: 0,
        airlines: [],
        totalTime: 0,
        segments: []
      };
    }

    // Priority queue implementation using array
    const distances = new Map<string, number>();
    const times = new Map<string, number>(); // total time in minutes
    const previous = new Map<string, { code: string; airline: string; speed: number } | null>();
    const airlines = new Map<string, string>();
    const visited = new Set<string>();
    const queue: { code: string; distance: number; time: number }[] = [];

    // Initialize distances and times with Infinity for all nodes
    console.log(`[DEBUG] Initializing distances for all nodes`);
    this.graph.forEach((node, code) => {
      const initialDistance = code === start ? 0 : Infinity;
      const initialTime = code === start ? 0 : Infinity;
      distances.set(code, initialDistance);
      times.set(code, initialTime);
      previous.set(code, null);
      queue.push({ 
        code, 
        distance: initialDistance,
        time: initialTime
      });
      console.log(`[DEBUG] Node ${code} initialized with distance: ${initialDistance}`);
    });

    while (queue.length > 0) {
      // Find node with minimum distance
      queue.sort((a, b) => a.distance - b.distance);
      const current = queue.shift()!;
      
      if (visited.has(current.code)) {
        console.log(`[DEBUG] Node ${current.code} already visited, skipping`);
        continue;
      }
      
      visited.add(current.code);
      console.log(`[DEBUG] Processing node: ${current.code}, distance: ${current.distance}`);

      if (current.code === end) {
        console.log(`[DEBUG] Reached end node ${end}`);
        break;
      }

      const currentNode = this.graph.get(current.code);
      if (!currentNode) {
        console.log(`[DEBUG] Node ${current.code} not found in graph`);
        continue;
      }

      currentNode.neighbors.forEach(neighbor => {
        if (visited.has(neighbor.code)) {
          console.log(`[DEBUG] Neighbor ${neighbor.code} already visited, skipping`);
          return;
        }

        const newDistance = distances.get(current.code)! + neighbor.distance;
        const flightTime = (neighbor.distance / neighbor.speed) * 60; // convert to minutes
        const newTime = times.get(current.code)! + flightTime;
        
        console.log(`[DEBUG] Checking neighbor ${neighbor.code}: current distance = ${distances.get(neighbor.code)}, new distance = ${newDistance}`);
        
        if (newDistance < distances.get(neighbor.code)!) {
          console.log(`[DEBUG] Updating distance to ${neighbor.code}: ${newDistance}`);
          distances.set(neighbor.code, newDistance);
          times.set(neighbor.code, newTime);
          previous.set(neighbor.code, { 
            code: current.code, 
            airline: neighbor.airline,
            speed: neighbor.speed
          });
          airlines.set(neighbor.code, neighbor.airline);
          
          // Update queue
          const queueItem = queue.find(item => item.code === neighbor.code);
          if (queueItem) {
            queueItem.distance = newDistance;
            queueItem.time = newTime;
          }
        }
      });
    }

    // Reconstruct path from end to start, then reverse to get correct order
    console.log(`[DEBUG] Reconstructing path from ${end} to ${start}`);
    const path: string[] = [];
    const routeAirlines: string[] = [];
    let current: string | null = end;

    while (current !== null) {
      path.unshift(current); // Add to beginning to build path in correct order
      const prev = previous.get(current);
      if (prev && current !== start) {
        routeAirlines.unshift(airlines.get(current)!);
      }
      current = prev?.code || null;
    }

    console.log(`[DEBUG] Reconstructed path:`, path);

    if (path[0] !== start) {
      console.log(`[DEBUG] Invalid path: expected ${start} but got ${path[0]}`);
      return null; // No path found
    }

    const segments = this.getPathSegments(path);
    const result = {
      path,
      totalDistance: distances.get(end)!,
      airlines: routeAirlines,
      totalTime: times.get(end)!,
      segments
    };

    console.log(`[DEBUG] Shortest path result:`, result);
    return result;
  }

  public getAllPaths(): string[] {
    return Array.from(this.graph.keys());
  }

  // K-shortest paths implementation using modified approach for better path ordering
  public findKShortestPaths(start: string, end: string, k: number = 3): Array<{
    path: string[];
    totalDistance: number;
    airlines: string[];
    totalTime: number;
    segments?: Array<{
      from: string;
      to: string;
      distance: number;
      fromName: string;
      toName: string;
      airline: string;
    }>;
  }> {
    console.log(`[DEBUG] Finding K-shortest paths from ${start} to ${end}`);
    
    const shortestPaths: Array<{
      path: string[];
      totalDistance: number;
      airlines: string[];
      totalTime: number;
      segments?: Array<{
        from: string;
        to: string;
        distance: number;
        fromName: string;
        toName: string;
        airline: string;
      }>;
    }> = [];

    // Find the shortest path first
    const shortestPath = this.findShortestPath(start, end);
    if (!shortestPath) {
      console.log('[DEBUG] No shortest path found');
      return [];
    }
    
    console.log('[DEBUG] Shortest path found:', shortestPath.path);
    shortestPaths.push(shortestPath);

    // For k-1 more paths using a simpler approach: find paths by removing edges
    for (let i = 1; i < k; i++) {
      console.log(`[DEBUG] Finding alternative path ${i + 1}`);
      
      // Try to find alternative paths by temporarily removing edges from the shortest path
      const candidates: Array<{
        path: string[];
        totalDistance: number;
        airlines: string[];
        totalTime: number;
        segments?: Array<{
          from: string;
          to: string;
          distance: number;
          fromName: string;
          toName: string;
          airline: string;
        }>;
      }> = [];

      // Get the shortest path so far
      const referencePath = shortestPaths[0].path;
      
      // Try removing each edge in the reference path to find alternatives
      for (let j = 0; j < referencePath.length - 1; j++) {
        const edgeFrom = referencePath[j];
        const edgeTo = referencePath[j + 1];
        
        console.log(`[DEBUG] Trying without edge ${edgeFrom} -> ${edgeTo}`);
        
        // Temporarily remove this edge
        const removedEdges = [{ from: edgeFrom, to: edgeTo }, { from: edgeTo, to: edgeFrom }];
        
        // Find alternative path without this edge
        const altPath = this.findShortestPathWithRestrictions(start, end, [], removedEdges);
        
        if (altPath) {
          console.log(`[DEBUG] Found alternative without edge ${edgeFrom} -> ${edgeTo}:`, altPath.path);
          
          // Check if this path is different from existing paths
          const isDuplicate = shortestPaths.some(existing => 
            this.arraysEqual(existing.path, altPath.path)
          );
          
          if (!isDuplicate) {
            candidates.push(altPath);
          }
        }
      }

      // Also try finding paths with different intermediate nodes
      if (candidates.length === 0) {
        // Try a different approach: find paths via different intermediate airports
        const allNodes = Array.from(this.graph.keys());
        const importantNodes = allNodes
          .map(node => ({ node, degree: this.graph.get(node)?.neighbors.length || 0 }))
          .sort((a, b) => b.degree - a.degree)
          .slice(0, Math.min(10, allNodes.length)) // Top 10 hubs
          .map(item => item.node);

        for (const hub of importantNodes) {
          if (hub === start || hub === end) continue;
          
          console.log(`[DEBUG] Trying path via hub ${hub}`);
          
          // Try path: start -> hub -> end
          const firstLeg = this.findShortestPath(start, hub);
          const secondLeg = this.findShortestPath(hub, end);
          
          if (firstLeg && secondLeg && firstLeg.path.length > 1 && secondLeg.path.length > 1) {
            // Combine paths, removing duplicate hub
            const combinedPath = [...firstLeg.path, ...secondLeg.path.slice(1)];
            const combinedDistance = firstLeg.totalDistance + secondLeg.totalDistance;
            const combinedTime = firstLeg.totalTime + secondLeg.totalTime;
            const combinedAirlines = [...firstLeg.airlines, ...secondLeg.airlines];
            const combinedSegments = [...(firstLeg.segments || []), ...(secondLeg.segments || [])];
            
            // Check if this path is different from existing paths
            const isDuplicate = shortestPaths.some(existing => 
              this.arraysEqual(existing.path, combinedPath)
            );
            
            if (!isDuplicate) {
              candidates.push({
                path: combinedPath,
                totalDistance: combinedDistance,
                airlines: combinedAirlines,
                totalTime: combinedTime,
                segments: combinedSegments
              });
            }
          }
        }
      }

      // Add the best candidate (shortest distance)
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.totalDistance - b.totalDistance);
        const bestCandidate = candidates[0];
        
        console.log(`[DEBUG] Adding alternative path ${i + 1}:`, bestCandidate.path);
        shortestPaths.push(bestCandidate);
      } else {
        console.log(`[DEBUG] No more alternative paths found`);
        break; // No more alternatives found
      }
    }

    console.log(`[DEBUG] Final K-shortest paths:`, shortestPaths.map(p => p.path));
    return shortestPaths.slice(0, k);
  }

  // Helper method to find shortest path with restrictions
  private findShortestPathWithRestrictions(start: string, end: string, removedNodes: string[], removedEdges: Array<{ from: string; to: string }>): {
    path: string[];
    totalDistance: number;
    airlines: string[];
    totalTime: number;
    segments?: Array<{
      from: string;
      to: string;
      distance: number;
      fromName: string;
      toName: string;
      airline: string;
    }>;
  } | null {
    console.log(`[DEBUG] Finding restricted path from ${start} to ${end}`);
    console.log(`[DEBUG] Removed nodes:`, removedNodes);
    console.log(`[DEBUG] Removed edges:`, removedEdges);

    if (!this.graph.has(start) || !this.graph.has(end) || removedNodes.includes(start) || removedNodes.includes(end)) {
      console.log(`[DEBUG] Start or end node not available`);
      return null;
    }

    if (start === end) {
      console.log(`[DEBUG] Start and end are the same`);
      return {
        path: [start],
        totalDistance: 0,
        airlines: [],
        totalTime: 0,
        segments: []
      };
    }

    const distances = new Map<string, number>();
    const times = new Map<string, number>();
    const previous = new Map<string, { code: string; airline: string; speed: number } | null>();
    const airlinesMap = new Map<string, string>();
    const visited = new Set<string>();
    const queue: { code: string; distance: number; time: number }[] = [];

    // Initialize distances and times
    this.graph.forEach((node, code) => {
      const isRemoved = removedNodes.includes(code);
      distances.set(code, isRemoved ? Infinity : (code === start ? 0 : Infinity));
      times.set(code, isRemoved ? Infinity : (code === start ? 0 : Infinity));
      previous.set(code, null);
      if (!isRemoved) {
        queue.push({ 
          code, 
          distance: code === start ? 0 : Infinity,
          time: code === start ? 0 : Infinity
        });
      }
    });

    console.log(`[DEBUG] Initial distances set`);

    while (queue.length > 0) {
      queue.sort((a, b) => a.distance - b.distance);
      const current = queue.shift()!;
      
      if (visited.has(current.code)) continue;
      visited.add(current.code);

      console.log(`[DEBUG] Processing node: ${current.code}, distance: ${current.distance}`);

      if (current.code === end) {
        console.log(`[DEBUG] Reached end node`);
        break;
      }

      const currentNode = this.graph.get(current.code);
      if (!currentNode) continue;

      currentNode.neighbors.forEach(neighbor => {
        if (visited.has(neighbor.code) || removedNodes.includes(neighbor.code)) return;

        // Check if this edge is removed
        const isEdgeRemoved = removedEdges.some(edge => 
          (edge.from === current.code && edge.to === neighbor.code) ||
          (edge.from === neighbor.code && edge.to === current.code)
        );
        if (isEdgeRemoved) {
          console.log(`[DEBUG] Edge ${current.code} -> ${neighbor.code} is removed`);
          return;
        }

        const newDistance = distances.get(current.code)! + neighbor.distance;
        const flightTime = (neighbor.distance / neighbor.speed) * 60;
        const newTime = times.get(current.code)! + flightTime;
        
        if (newDistance < distances.get(neighbor.code)!) {
          console.log(`[DEBUG] Updating distance to ${neighbor.code}: ${newDistance}`);
          distances.set(neighbor.code, newDistance);
          times.set(neighbor.code, newTime);
          previous.set(neighbor.code, { 
            code: current.code, 
            airline: neighbor.airline,
            speed: neighbor.speed
          });
          airlinesMap.set(neighbor.code, neighbor.airline);
          
          const queueItem = queue.find(item => item.code === neighbor.code);
          if (queueItem) {
            queueItem.distance = newDistance;
            queueItem.time = newTime;
          }
        }
      });
    }

    // Reconstruct path from end to start, then reverse
    console.log(`[DEBUG] Reconstructing path`);
    const path: string[] = [];
    const routeAirlines: string[] = [];
    let current: string | null = end;

    while (current !== null) {
      path.unshift(current); // Add to beginning to build path in correct order
      const prev = previous.get(current);
      if (prev && current !== start) {
        routeAirlines.unshift(airlinesMap.get(current)!);
      }
      current = prev?.code || null;
    }

    console.log(`[DEBUG] Reconstructed path:`, path);

    if (path[0] !== start || path[path.length - 1] !== end) {
      console.log(`[DEBUG] Invalid path reconstruction`);
      return null;
    }

    const segments = this.getPathSegments(path);

    const result = {
      path,
      totalDistance: distances.get(end)!,
      airlines: routeAirlines,
      totalTime: times.get(end)!,
      segments
    };

    console.log(`[DEBUG] Restricted path result:`, result);
    return result;
  }

  // Helper methods
  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  private calculatePathDistance(path: string[]): number {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const fromNode = this.graph.get(path[i]);
      const neighbor = fromNode?.neighbors.find(n => n.code === path[i + 1]);
      if (neighbor) {
        totalDistance += neighbor.distance;
      }
    }
    return totalDistance;
  }

  private calculatePathTime(path: string[]): number {
    let totalTime = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const fromNode = this.graph.get(path[i]);
      const neighbor = fromNode?.neighbors.find(n => n.code === path[i + 1]);
      if (neighbor) {
        totalTime += (neighbor.distance / neighbor.speed) * 60;
      }
    }
    return totalTime;
  }

  private getPathAirlines(path: string[]): string[] {
    const airlines: string[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const fromNode = this.graph.get(path[i]);
      const neighbor = fromNode?.neighbors.find(n => n.code === path[i + 1]);
      if (neighbor) {
        airlines.push(neighbor.airline);
      }
    }
    return airlines;
  }

  // Graph analysis methods
  public getGraphAnalysis() {
    const nodes = Array.from(this.graph.keys());
    const edges: Array<{ from: string; to: string; airline: string }> = [];
    
    // Count edges
    this.graph.forEach((node, code) => {
      node.neighbors.forEach(neighbor => {
        // Avoid duplicate edges (undirected graph)
        if (!edges.some(e => (e.from === code && e.to === neighbor.code) || (e.from === neighbor.code && e.to === code))) {
          edges.push({ from: code, to: neighbor.code, airline: neighbor.airline });
        }
      });
    });

    // Calculate degrees
    const degrees: Map<string, number> = new Map();
    nodes.forEach(node => {
      const nodeData = this.graph.get(node);
      degrees.set(node, nodeData?.neighbors.length || 0);
    });

    // Find isolated nodes (degree 0)
    const isolatedNodes = nodes.filter(node => (degrees.get(node) || 0) === 0);

    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      degrees: Object.fromEntries(degrees),
      isolatedNodes,
      averageDegree: edges.length > 0 ? (2 * edges.length) / nodes.length : 0
    };
  }

  // Check if graph is connected
  public isConnected(): boolean {
    const nodes = Array.from(this.graph.keys());
    if (nodes.length === 0) return true;

    const startNode = nodes[0];
    const visited = new Set<string>();
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentNode = this.graph.get(current);
      
      if (currentNode) {
        currentNode.neighbors.forEach(neighbor => {
          if (!visited.has(neighbor.code)) {
            visited.add(neighbor.code);
            queue.push(neighbor.code);
          }
        });
      }
    }

    return visited.size === nodes.length;
  }

  // Get airline performance analysis
  public getAirlinePerformance() {
    const airlineStats: Map<string, { routes: number; totalDistance: number; averageDistance: number }> = new Map();
    
    this.graph.forEach((node, code) => {
      node.neighbors.forEach(neighbor => {
        const airline = neighbor.airline;
        const current = airlineStats.get(airline) || { routes: 0, totalDistance: 0, averageDistance: 0 };
        current.routes += 1;
        current.totalDistance += neighbor.distance;
        airlineStats.set(airline, current);
      });
    });

    // Calculate average distances
    airlineStats.forEach((stats, airline) => {
      stats.averageDistance = stats.routes > 0 ? stats.totalDistance / stats.routes : 0;
    });

    return Object.fromEntries(airlineStats);
  }
}