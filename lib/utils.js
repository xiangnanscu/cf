// ES6 JavaScript version of utils functions

class Utils {
  /**
   * Check if a value is callable (function)
   * @param {*} value
   * @returns {boolean}
   */
  static callable(value) {
    return typeof value === 'function';
  }

  /**
   * Get query condition from request query parameters
   * @param {Object} query
   * @returns {Object}
   */
  static get_query_condition(query) {
    const condition = {};

    // Handle common query parameters for filtering
    if (query.keyword) {
      condition.keyword = query.keyword;
    }

    if (query.search) {
      condition.search = query.search;
    }

    // Handle date range filters
    if (query.start_date) {
      condition.start_date = query.start_date;
    }

    if (query.end_date) {
      condition.end_date = query.end_date;
    }

    // Handle status filters
    if (query.status) {
      condition.status = query.status;
    }

    // Handle ID filters
    if (query.id) {
      condition.id = query.id;
    }

    return condition;
  }

  /**
   * Merge multiple objects into one (similar to Lua's dict function)
   * @param {...Object} objects
   * @returns {Object}
   */
  static dict(...objects) {
    const result = {};

    for (const obj of objects) {
      if (obj && typeof obj === 'object') {
        Object.assign(result, obj);
      }
    }

    return result;
  }

  /**
   * Deep clone an object
   * @param {*} obj
   * @returns {*}
   */
  static deep_clone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deep_clone(item));
    }

    const cloned = {};
    for (const [key, value] of Object.entries(obj)) {
      cloned[key] = this.deep_clone(value);
    }

    return cloned;
  }

  /**
   * Check if value is empty (null, undefined, empty string, empty array, empty object)
   * @param {*} value
   * @returns {boolean}
   */
  static is_empty(value) {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'string') {
      return value.trim() === '';
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }

    return false;
  }

  /**
   * Format string with placeholders (simple version)
   * @param {string} template
   * @param {...*} args
   * @returns {string}
   */
  static format(template, ...args) {
    return template.replace(/%s/g, () => args.shift() || '');
  }

  /**
   * Convert value to string safely
   * @param {*} value
   * @returns {string}
   */
  static to_string(value) {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (err) {
        return '[object Object]';
      }
    }

    return String(value);
  }

  /**
   * Convert value to number safely
   * @param {*} value
   * @param {number} default_value
   * @returns {number}
   */
  static to_number(value, default_value = 0) {
    const num = Number(value);
    return isNaN(num) ? default_value : num;
  }

  /**
   * Escape HTML special characters
   * @param {string} str
   * @returns {string}
   */
  static escape_html(str) {
    const html_escapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return String(str).replace(/[&<>"']/g, match => html_escapes[match]);
  }

  /**
   * Generate a simple UUID
   * @returns {string}
   */
  static generate_uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Debounce function execution
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
  static debounce(func, wait) {
    let timeout;
    return function executed_function(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function execution
   * @param {Function} func
   * @param {number} limit
   * @returns {Function}
   */
  static throttle(func, limit) {
    let in_throttle;
    return function executed_function(...args) {
      if (!in_throttle) {
        func.apply(this, args);
        in_throttle = true;
        setTimeout(() => in_throttle = false, limit);
      }
    };
  }
}

export default Utils;