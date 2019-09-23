/**
 * @module meteoJS/base/named
 */
import extend from 'jquery-extend';

/**
 * Options for constructor.
 * 
 * @typedef {Object} meteoJS/base/named~options
 * @param {Object.<string,string>} names - Names.
 * @param {string[]} [langSortation] - Priority of language codes.
 */

/**
 * @classdesc Class with a name in different languages.
 */
export class Named {
  
  /**
   * @param {meteoJS/base/named~options} [options] - Options.
   */
  constructor(options = {}) {
    options = extend(true, {
      names: undefined,
      langSortation: undefined
    }, options);
    this.names = options.names === undefined ? {} : options.names;
    this.langSortation =
      options.langSortation === undefined ? [] : options.langSortation;
  }
  
  /**
   * @returns {string} Default name.
   */
  get name() {
    return this.getNameByLang();
  }
  
  /**
   * @param {string} [lang] - Language code.
   * @param {Object} [options] - Options.
   * @param {string[]} [options.langSortation] - Priority of language codes.
   * @returns {string} Name in the passed or a fallback language.
   */
  getNameByLang(lang = undefined, options = {}) {
    let langSortation =
      ('langSortation' in options) ? options.langSortation : this.langSortation;
    let langs = Object.keys(this.names);
    if (langs.length < 1)
      return '';
    return this.names[langs.sort((a, b) => {
      if (a == lang) return -1;
      if (b == lang) return 1;
      let ia = langSortation.indexOf(a);
      let ib = langSortation.indexOf(b);
      if (ib < 0) return 0;
      if (ia < 0) return 1;
      return ia < ib ? -1 : ia == ib ? 0 : 1;
    })[0]];
  }
  
  /**
   * @param {string} lang - Language code.
   * @returns {string} Name in the passed language.
   */
  getNameByLangNoFallback(lang) {
    return (lang in this.names)  ? this.names[lang] : '';
  }
}
export default Named;