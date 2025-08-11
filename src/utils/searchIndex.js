/**
 * Search indexing system for faster text matching
 */
class SearchIndex {
  constructor(options = {}) {
    this.indexes = new Map();
    this.reverseIndex = new Map(); // word -> item IDs
    this.itemData = new Map(); // item ID -> item data
    this.options = {
      minWordLength: options.minWordLength || 2,
      maxWordLength: options.maxWordLength || 50,
      caseSensitive: options.caseSensitive || false,
      stemming: options.stemming || false,
      stopWords: new Set(options.stopWords || ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
    };
    this.isBuilt = false;
    this.buildTime = 0;
  }

  /**
   * Build search index from items array
   */
  buildIndex(items, searchFields = ['name', 'description', 'manufacturer']) {
    const startTime = performance.now();
    
    // Clear existing indexes
    this.indexes.clear();
    this.reverseIndex.clear();
    this.itemData.clear();

    items.forEach(item => {
      if (!item.id) return;

      // Store item data
      this.itemData.set(item.id, item);

      // Index each search field
      searchFields.forEach(field => {
        const fieldValue = item[field];
        if (fieldValue && typeof fieldValue === 'string') {
          this.indexText(item.id, fieldValue, field);
        }
      });
    });

    this.buildTime = performance.now() - startTime;
    this.isBuilt = true;
    
    console.log(`Search index built in ${this.buildTime.toFixed(2)}ms for ${items.length} items`);
  }

  /**
   * Index text content for an item
   */
  indexText(itemId, text, field) {
    const words = this.tokenize(text);
    
    words.forEach(word => {
      const normalizedWord = this.normalizeWord(word);
      if (!this.isValidWord(normalizedWord)) return;

      // Add to reverse index
      if (!this.reverseIndex.has(normalizedWord)) {
        this.reverseIndex.set(normalizedWord, new Map());
      }
      
      const wordIndex = this.reverseIndex.get(normalizedWord);
      if (!wordIndex.has(itemId)) {
        wordIndex.set(itemId, {
          fields: new Set(),
          positions: [],
          frequency: 0
        });
      }

      const itemEntry = wordIndex.get(itemId);
      itemEntry.fields.add(field);
      itemEntry.frequency++;
    });
  }

  /**
   * Tokenize text into words
   */
  tokenize(text) {
    // Split on whitespace and punctuation, but preserve alphanumeric characters
    return text.split(/[\s\-_.,;:!?()[\]{}'"]+/)
      .filter(word => word.length > 0);
  }

  /**
   * Normalize word for indexing
   */
  normalizeWord(word) {
    let normalized = this.options.caseSensitive ? word : word.toLowerCase();
    
    // Remove leading/trailing punctuation
    normalized = normalized.replace(/^[^\w]+|[^\w]+$/g, '');
    
    // Apply stemming if enabled (simple suffix removal)
    if (this.options.stemming) {
      normalized = this.applyStemming(normalized);
    }
    
    return normalized;
  }

  /**
   * Simple stemming algorithm
   */
  applyStemming(word) {
    // Simple suffix removal rules
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 's'];
    
    for (const suffix of suffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 2) {
        return word.slice(0, -suffix.length);
      }
    }
    
    return word;
  }

  /**
   * Check if word should be indexed
   */
  isValidWord(word) {
    return word.length >= this.options.minWordLength &&
           word.length <= this.options.maxWordLength &&
           !this.options.stopWords.has(word) &&
           /\w/.test(word); // Contains at least one alphanumeric character
  }

  /**
   * Search for items matching query
   */
  search(query, options = {}) {
    if (!this.isBuilt) {
      throw new Error('Search index not built. Call buildIndex() first.');
    }

    const startTime = performance.now();
    const searchTerms = this.tokenize(query);
    const normalizedTerms = searchTerms.map(term => this.normalizeWord(term))
      .filter(term => this.isValidWord(term));

    if (normalizedTerms.length === 0) {
      return {
        results: [],
        searchTime: performance.now() - startTime,
        totalMatches: 0
      };
    }

    // Find items that match search terms
    const itemScores = new Map();
    const matchDetails = new Map();

    normalizedTerms.forEach((term, termIndex) => {
      // Exact matches
      const exactMatches = this.reverseIndex.get(term) || new Map();
      
      // Prefix matches
      const prefixMatches = new Map();
      for (const [indexedWord, items] of this.reverseIndex.entries()) {
        if (indexedWord.startsWith(term) && indexedWord !== term) {
          for (const [itemId, data] of items.entries()) {
            if (!prefixMatches.has(itemId)) {
              prefixMatches.set(itemId, data);
            }
          }
        }
      }

      // Fuzzy matches (simple edit distance)
      const fuzzyMatches = new Map();
      if (options.fuzzy && term.length > 3) {
        for (const [indexedWord, items] of this.reverseIndex.entries()) {
          if (this.editDistance(term, indexedWord) <= 1) {
            for (const [itemId, data] of items.entries()) {
              if (!fuzzyMatches.has(itemId)) {
                fuzzyMatches.set(itemId, data);
              }
            }
          }
        }
      }

      // Score matches
      this.scoreMatches(exactMatches, itemScores, matchDetails, term, 'exact', 10);
      this.scoreMatches(prefixMatches, itemScores, matchDetails, term, 'prefix', 5);
      if (options.fuzzy) {
        this.scoreMatches(fuzzyMatches, itemScores, matchDetails, term, 'fuzzy', 2);
      }
    });

    // Convert to results array and sort by score
    const results = Array.from(itemScores.entries())
      .map(([itemId, score]) => ({
        item: this.itemData.get(itemId),
        score,
        matches: matchDetails.get(itemId) || []
      }))
      .filter(result => result.item) // Ensure item exists
      .sort((a, b) => b.score - a.score);

    const searchTime = performance.now() - startTime;

    return {
      results,
      searchTime,
      totalMatches: results.length,
      indexStats: this.getIndexStats()
    };
  }

  /**
   * Score search matches
   */
  scoreMatches(matches, itemScores, matchDetails, term, matchType, baseScore) {
    for (const [itemId, data] of matches.entries()) {
      let score = baseScore * data.frequency;
      
      // Boost score for name field matches
      if (data.fields.has('name')) {
        score *= 2;
      }
      
      // Add to total score
      const currentScore = itemScores.get(itemId) || 0;
      itemScores.set(itemId, currentScore + score);
      
      // Store match details
      if (!matchDetails.has(itemId)) {
        matchDetails.set(itemId, []);
      }
      matchDetails.get(itemId).push({
        term,
        matchType,
        fields: Array.from(data.fields),
        frequency: data.frequency,
        score
      });
    }
  }

  /**
   * Calculate simple edit distance between two strings
   */
  editDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get suggestions for partial queries
   */
  getSuggestions(partialQuery, maxSuggestions = 10) {
    if (!this.isBuilt || !partialQuery) return [];

    const normalizedQuery = this.normalizeWord(partialQuery);
    const suggestions = new Set();

    // Find words that start with the query
    for (const word of this.reverseIndex.keys()) {
      if (word.startsWith(normalizedQuery) && word !== normalizedQuery) {
        suggestions.add(word);
        if (suggestions.size >= maxSuggestions) break;
      }
    }

    return Array.from(suggestions).slice(0, maxSuggestions);
  }

  /**
   * Update index when items change
   */
  updateItem(item, searchFields = ['name', 'description', 'manufacturer']) {
    if (!item.id) return;

    // Remove old entries for this item
    this.removeItem(item.id);

    // Add new entries
    this.itemData.set(item.id, item);
    searchFields.forEach(field => {
      const fieldValue = item[field];
      if (fieldValue && typeof fieldValue === 'string') {
        this.indexText(item.id, fieldValue, field);
      }
    });
  }

  /**
   * Remove item from index
   */
  removeItem(itemId) {
    // Remove from item data
    this.itemData.delete(itemId);

    // Remove from reverse index
    for (const [word, items] of this.reverseIndex.entries()) {
      items.delete(itemId);
      if (items.size === 0) {
        this.reverseIndex.delete(word);
      }
    }
  }

  /**
   * Get index statistics
   */
  getIndexStats() {
    return {
      totalItems: this.itemData.size,
      totalWords: this.reverseIndex.size,
      buildTime: this.buildTime,
      isBuilt: this.isBuilt,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage of the index
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    
    // Estimate reverse index size
    for (const [word, items] of this.reverseIndex.entries()) {
      totalSize += word.length * 2; // Approximate string size
      totalSize += items.size * 50; // Approximate item entry size
    }
    
    // Estimate item data size
    totalSize += this.itemData.size * 200; // Approximate item size
    
    return Math.round(totalSize / 1024); // Return in KB
  }

  /**
   * Clear the entire index
   */
  clear() {
    this.indexes.clear();
    this.reverseIndex.clear();
    this.itemData.clear();
    this.isBuilt = false;
    this.buildTime = 0;
  }
}

// Create singleton instance
export const searchIndex = new SearchIndex({
  minWordLength: 2,
  caseSensitive: false,
  stemming: true,
  stopWords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
});

export default SearchIndex;