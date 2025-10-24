import { CentralityAnalyzer, NetworkAnalysisResult } from '@/lib/centrality';

interface CacheEntry {
  data: NetworkAnalysisResult;
  timestamp: number;
  routesHash: string;
}

interface CentralityWorkerMessage {
  type: 'CENTRALITY_RESULT' | 'CENTRALITY_ERROR';
  payload: any;
  success: boolean;
}

export class CentralityManager {
  private worker: Worker | null = null;
  private cache: Map<string, CacheEntry> = new Map();
  private CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private pendingCalculations: Map<string, { resolve: (value: NetworkAnalysisResult) => void; reject: (reason?: any) => void }> = new Map();

  constructor() {
    // Initialize worker only in browser environment
    if (typeof window !== 'undefined') {
      this.initializeWorker();
    }
  }

  private initializeWorker() {
    try {
      // For Next.js, use proper worker initialization
      this.worker = new Worker(new URL('../workers/centrality.worker.ts', import.meta.url));
      
      this.worker.onmessage = (event: MessageEvent<CentralityWorkerMessage>) => {
        this.handleWorkerMessage(event);
      };
      
      this.worker.onerror = (error) => {
        console.error('Centrality Worker Error:', {
          message: error.message,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
          error: error.error,
          stack: error.error?.stack
        });
        this.rejectPendingCalculations(new Error(`Worker error: ${error.message || 'Unknown error'}`));
      };
    } catch (error) {
      console.error('Failed to initialize centrality worker:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        isClient: typeof window !== 'undefined',
        hasWorker: typeof Worker !== 'undefined'
      });
      this.worker = null;
    }
  }

  private generateRoutesHash(routes: any[]): string {
    const routesString = JSON.stringify(routes);
    let hash = 0;
    for (let i = 0; i < routesString.length; i++) {
      const char = routesString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private getCacheKey(routes: any[]): string {
    const hash = this.generateRoutesHash(routes);
    return `centrality_${hash}`;
  }

  private getFromCache(routes: any[]): NetworkAnalysisResult | null {
    const cacheKey = this.getCacheKey(routes);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    
    return null;
  }

  private setCache(routes: any[], data: NetworkAnalysisResult): void {
    const cacheKey = this.getCacheKey(routes);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      routesHash: this.generateRoutesHash(routes)
    });
  }

  private handleWorkerMessage(event: MessageEvent<CentralityWorkerMessage>) {
    const { type, payload, success } = event.data;
    
    if (type === 'CENTRALITY_RESULT' && success) {
      // Resolve all pending calculations with the same cache key
      for (const [key, calculation] of this.pendingCalculations) {
        calculation.resolve(payload);
        this.pendingCalculations.delete(key);
        break; // Resolve one at a time for simplicity
      }
    } else if (type === 'CENTRALITY_ERROR') {
      console.error('Centrality calculation error:', {
        error: payload.error,
        payload: payload,
        messageType: type,
        success: success
      });
      this.rejectPendingCalculations(new Error(payload.error || 'Unknown centrality calculation error'));
    }
  }

  private rejectPendingCalculations(error: Error) {
    for (const [key, calculation] of this.pendingCalculations) {
      calculation.reject(error);
      this.pendingCalculations.delete(key);
    }
  }

  async calculateCentrality(
    routes: any[], 
    airports: any[]
  ): Promise<NetworkAnalysisResult> {
    // Check cache first
    const cached = this.getFromCache(routes);
    if (cached) {
      console.log('Using cached centrality data');
      return cached;
    }

    // Use fallback calculation if worker is not available
    if (!this.worker) {
      console.log('Worker not available, using fallback calculation');
      return this.fallbackCalculation(routes, airports);
    }

    const cacheKey = this.getCacheKey(routes);
    
    // Check if calculation is already pending
    if (this.pendingCalculations.has(cacheKey)) {
      return new Promise((resolve, reject) => {
        // Wait for existing calculation
        setTimeout(() => {
          const cached = this.getFromCache(routes);
          if (cached) {
            resolve(cached);
          } else {
            reject(new Error('Calculation timeout'));
          }
        }, 100);
      });
    }

    // Create new calculation promise
    const calculationPromise = new Promise<NetworkAnalysisResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Fallback to main thread if worker takes too long
        console.log('Worker calculation timeout, using fallback');
        this.fallbackCalculation(routes, airports).then(resolve).catch(reject);
        this.pendingCalculations.delete(cacheKey);
      }, 5000); // 5 second timeout

      const messageHandler = (event: MessageEvent<CentralityWorkerMessage>) => {
        clearTimeout(timeout);
        
        const { type, payload, success } = event.data;
        
        if (type === 'CENTRALITY_RESULT' && success) {
          this.setCache(routes, payload);
          this.worker?.removeEventListener('message', messageHandler);
          this.pendingCalculations.delete(cacheKey);
          resolve(payload);
        } else if (type === 'CENTRALITY_ERROR') {
          this.worker?.removeEventListener('message', messageHandler);
          this.pendingCalculations.delete(cacheKey);
          reject(new Error(payload.error));
        }
      };

      this.worker?.addEventListener('message', messageHandler);
      
      // Store the resolve/reject functions
      this.pendingCalculations.set(cacheKey, { resolve, reject });
      
      // Send calculation request to worker
      try {
        this.worker?.postMessage({
          type: 'CALCULATE_CENTRALITY',
          payload: { routes, airports }
        });
      } catch (error) {
        clearTimeout(timeout);
        this.worker?.removeEventListener('message', messageHandler);
        this.pendingCalculations.delete(cacheKey);
        console.error('Failed to send message to worker:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          workerState: this.worker ? 'available' : 'null'
        });
        reject(new Error(`Failed to communicate with worker: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });

    return calculationPromise;
  }

  private fallbackCalculation(routes: any[], airports: any[]): Promise<NetworkAnalysisResult> {
    return new Promise((resolve) => {
      // Use the existing CentralityAnalyzer as fallback
      const analyzer = new CentralityAnalyzer(routes, airports);
      const result = analyzer.calculateNetworkCentrality();
      
      // Cache the result
      this.setCache(routes, result);
      
      resolve(result);
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  async preload(routes: any[], airports: any[]): Promise<void> {
    try {
      await this.calculateCentrality(routes, airports);
      console.log('Centrality data preloaded successfully');
    } catch (error) {
      console.error('Failed to preload centrality data:', error);
    }
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.cache.clear();
    this.pendingCalculations.clear();
  }
}

// Singleton instance
export const centralityManager = new CentralityManager();