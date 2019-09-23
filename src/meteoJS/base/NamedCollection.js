/**
 * @module meteoJS/base/namedCollection
 */
import Collection from './Collection.js';
import Named from './Named.js';

/**
 * Options for constructor.
 * 
 * @typedef {module:meteoJS/base/collection~options}
 *   meteoJS/base/namedCollection~options
 * @param {Object.<string,string>} names - Names.
 * @param {string[]} [langSortation] - Priority of language codes.
 */

/**
 * @classdesc Collection-class with i18n names.
 */
export class NamedCollection extends Collection {
  
  /**
   * @param {meteoJS/base/namedCollection~options} options - Options.
   */
  constructor({ fireReplace=true,
                fireAddRemoveOnReplace=false,
                appendOnReplace=true,
                sortFunction,
                emptyObjectMaker,
                names,
                langSortation } = {}) {
    super({
      fireReplace,
      fireAddRemoveOnReplace,
      appendOnReplace,
      sortFunction,
      emptyObjectMaker
    });
    
    Object.defineProperty(this, 'name',
      Object.getOwnPropertyDescriptor(Named.prototype, 'name'));
    Object.getPrototypeOf(this).getNameByLang = Named.prototype.getNameByLang;
    Object.getPrototypeOf(this).getNameByLangNoFallback =
      Named.prototype.getNameByLangNoFallback;
    // Named constructor code
    /** @type Object */
    this.names = names === undefined ? {} : names;
    /** @type Array */
    this.langSortation = langSortation === undefined ? [] : langSortation;
  }
}
export default NamedCollection;