/**
 * @module meteoJS/modelviewer/nwpResources
 */
import Resources from './Resources.js';
import VariableCollection from './VariableCollection.js';
import VariableCollectionNode from './VariableCollectionNode.js';

/**
 * @classdesc Setup a Resources-Object to be used for NWP.
 */
export class NWPResources extends Resources {
  
  constructor() {
    let collections = {};
    ['models', 'runs', 'regions', 'levels', 'accumulations', 'offsets']
    .forEach(id => collections[id] = new VariableCollection({ id }));
    let nodes = {};
    Object.keys(collections)
    .forEach(id => nodes[id] = new VariableCollectionNode(collections[id]));
    // build hierarchy
    nodes.models.appendChild(nodes.runs);
    nodes.runs.appendChild(nodes.regions);
    nodes.regions.appendChild(nodes.fields);
    nodes.fields.appendChild(nodes.levels, nodes.accumulations);
    nodes.levels.appendChild(nodes.offsets);
    nodes.accumulations.appendChild(nodes.offsets);
    
    super({
      topNode: nodes.models
    });
  }
  
  /**
   * Creates a Variable-Object and adds it to a VariableCollection.
   * 
   * @param {mixed} variableCollectionId - ID of the VariableCollection.
   * @param {Object} [options] - Options.
   * ...
   * @returns {NWPResources} This.
   */
  addVariable(variableCollectionId, { id, names = {} } = {}) {
    this.getVariableCollectionById(variableCollectionId).append(new Variable({
      id,
      names
    }));
    return this;
  }
  
  /**
   * Collection of all defined models.
   * 
   * @type module:meteoJS/modelviewer/variableCollection.VariableCollection
   */
  get modelCollection() {
    return this.topVariableCollection;
  }
  
  /**
   * Collection of all defined runs.
   * 
   * @type module:meteoJS/modelviewer/variableCollection.VariableCollection
   */
  get runCollection() {
    return this.getVariableCollectionById('runs');
  }
  
  /**
   * Collection of all defined regions.
   * 
   * @type module:meteoJS/modelviewer/variableCollection.VariableCollection
   */
  get regionCollection() {
    return this.getVariableCollectionById('regions');
  }
  
  /**
   * Collection of all defined fields.
   * 
   * @type module:meteoJS/modelviewer/variableCollection.VariableCollection
   */
  get fieldCollection() {
    return this.getVariableCollectionById('fields');
  }
  
  /**
   * Collection of all defined levels.
   * 
   * @type module:meteoJS/modelviewer/variableCollection.VariableCollection
   */
  get levelCollection() {
    return this.getVariableCollectionById('levels');
  }
  
  /**
   * Collection of all defined accumulations.
   * 
   * @type module:meteoJS/modelviewer/variableCollection.VariableCollection
   */
  get accumulationCollection() {
    return this.getVariableCollectionById('accumulations');
  }
  
  /**
   * Collection of all defined offsets.
   * 
   * @type module:meteoJS/modelviewer/variableCollection.VariableCollection
   */
  get offsetCollection() {
    return this.getVariableCollectionById('offsets');
  }
}
export default NWPResources;