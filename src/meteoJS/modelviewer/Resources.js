/**
 * @module meteoJS/modelviewer/resources
 */
import addEventFunctions from '../Events.js';
import Image from './resource/Image.js';
import VariableCollection from './VariableCollection.js';
import Node from './Node.js';

/**
 * Triggered on adding and removing Resource-Objects.
 * 
 * @event module:meteoJS/modelviewer/resources#change:resources
 * @type {Object}
 * @property {module:meteoJS/modelviewer/resource.Resource} [addedResources] -
 *   Added resources.
 * @property {module:meteoJS/modelviewer/resource.Resource} [removedResources] -
 *   Removed resources.
 */

/**
 * Options for constructor.
 * 
 * @typedef {Object} module:meteoJS/modelviewer/resources~options
 * @param {module:meteoJS/modelviewer/variableCollectionNode.VariableCollectionNode}
 *   topNode - Top VariableCollectionNode.
 */

/**
 * @classdesc Linchpin of the modelviewer. In this class every available
 *   resource is registered. Additionally requests about data per Variable can
 *   be performed, like all available run times of a model or all available
 *   fields of model, etc. The hierarchy via
 *   {@link module:meteoJS/modelviewer/node.Node|Node}
 *   has to be defined before the construction of Resources.
 * 
 * @fires module:meteoJS/modelviewer/resources#change:resources
 */
export class Resources {
  
  constructor({ topNode,
                collectTimesVariableCollections = [] } = {}) {
    
    /**
     * @type module:meteoJS/modelviewer/variableCollection.VariableCollection
     * @private
     */
    this._topNode = topNode;
    
    /**
     * @type Map<module:meteoJS/modelviewer/node.Node,
     *           Set<module:meteoJS/modelviewer/variable.Variable>>
     * @private
     */
    this._availableVariablesMap = new Map();
    
    this._collectTimesVariableCollections = collectTimesVariableCollections;
  }
  
  /**
   * VariableCollectionNode that stand on the top of the hierarchy.
   * 
   * @type module:meteoJS/modelviewer/variableCollection.VariableCollection
   * @readonly
   */
  get topNode() {
    return this._topNode;
  }
  
  /**
   * @type module:meteoJS/modelviewer/variableCollection.VariableCollection[]
   * @readonly
   */
  get variableCollections() {
    let pushChildCollections;
    pushChildCollections = node => {
      node.children.forEach(n => {
        result.push(n.variableCollection);
        pushChildCollections(n);
      });
    };
    let result = [this.topNode.variableCollection];
    pushChildCollections(this.topNode);
    return result;
  }
  
  /**
   * Map of nodes and their variables (contained in the variableCollection of
   * the node). For each variable exists at least one resource in this
   * Resources-object that is defined by this variable.
   * 
   * @type Map<module:meteoJS/modelviewer/node.Node,
   *           Set<module:meteoJS/modelviewer/variable.Variable>>
   * @readonly
   */
  get availableVariablesMap() {
    return this._availableVariablesMap;
  }
  
  /**
   * Append resources.
   * 
   * @param {...module:meteoJS/modelviewer/resource.Resource} resources
   *   Available resources.
   * @returns {module:meteoJS/modelviewer/resources.Resources} This.
   * @fires module:meteoJS/modelviewer/resources#change:resources
   */
  append(...resources) {
    let addedResources = [];
    resources.forEach(resource => {
      let topNode = this._getTopNodeOfResourceDefinition(resource, this.topNode);
      if (topNode !== undefined) {
        let node = this._getTopMostChildWithAllVariables(resource.variables.slice(), topNode, true);
        if (node !== undefined) {
          let addedCount = node.append(resource);
          if (addedCount > 0) {
            addedResources.push(resource);
            this._addAvailableVariablesMapByResource(resource);
          }
        }
      }
    });
    if (addedResources.length > 0)
      this.trigger('change:resources', { addedResources });
    return this;
  }
  
  /**
   * Adds variables of a resource to _availableVariablesMap.
   * 
   * @param {module:meteoJS/modelviewer/resource.Resource} resource - Resource.
   * @private
   */
  _addAvailableVariablesMapByResource(resource) {
    resource.variables.forEach(variable => {
      let node = this.getNodeByVariableCollection(variable.variableCollection);
      if (node.variableCollection.id !== undefined) {
        if (!this._availableVariablesMap.has(node))
          this._availableVariablesMap.set(node, new Set());
        this._availableVariablesMap.get(node).add(variable);
      }
    });
  }
  
  /**
   * Removes resources.
   * 
   * @param {...module:meteoJS/modelviewer/resource.Resource} resources
   *   Resources.
   * @returns {module:meteoJS/modelviewer/resources.Resources} This.
   * @fires module:meteoJS/modelviewer/resources#change:resources
   */
  remove(...resources) {
    let removedResources = [];
    let removedNodeResourcesMap = new Map()
    resources.forEach(resource => {
      let topNode = this._getTopNodeOfResourceDefinition(resource, this.topNode);
      if (topNode !== undefined) {
        let node = this._getTopMostChildWithAllVariables(resource.variables.slice(), topNode, true);
        if (node !== undefined) {
          let removedCount = node.remove(resource);
          if (removedCount > 0) {
            removedResources.push(resource);
            if (!removedNodeResourcesMap.has(node))
              removedNodeResourcesMap.set(node, new Set());
            removedNodeResourcesMap.get(node).add(resource);
          }
        }
      }
    });
    if (removedNodeResourcesMap.size > 0)
      this._removeAvailableVariablesMapByResources(removedNodeResourcesMap);
    if (removedResources.length > 0)
      this.trigger('change:resources', { removedResources });
    return this;
  }
  
  /**
   * Removes variables from _availableVariablesMap.
   * Prerequisite: The resources have already to be removed of the nodes.
   * 
   * @param {Map<module:meteoJS/modelviewer/node.Node,
   *         Set<module:meteoJS/modelviewer/resource.Resource>>}
   *   removedNodeResourcesMap - Map of Nodes with their removed Resources.
   * @private
   */
  _removeAvailableVariablesMapByResources(removedNodeResourcesMap) {
    let fullCheckVariables = new Set();
    for (let [node, resourcesSet] of removedNodeResourcesMap.entries()) {
      let variables = new Set();
      for (let resource of resourcesSet)
        resource.variables.forEach(variable => variables.add(variable));
      for (let variable of variables)
        if (node.getResourcesByVariables(variable).length == 0)
          fullCheckVariables.add(variable);
    }
    for (let variable of fullCheckVariables) {
      let node = this.getNodeByVariableCollection(variable.variableCollection);
      if (this._getResourcesOf(node, 'children', [ variable ]).length == 0)
        if (this._availableVariablesMap.has(node))
          this._availableVariablesMap.get(node).delete(variable);
    }
  }
  
  /**
   * Returns a node of the hierarchy, so that all parents and itself contain
   * all the passed variables. The returned node is the most top in hierarchy
   * as possible. If no node is found, an empty node object is returned.
   * 
   * @param {...module:meteoJS/modelviewer/variable.Variable} variables
   *   Variables.
   * @returns {module:meteoJS/modelviewer/node.Node} - Node.
   */
  getTopMostNodeWithAllVariables(...variables) {
    let result =
      this._getTopMostChildWithAllVariables(variables.slice(), this.topNode, true);
    return (result === undefined) ? new Node(new VariableCollection()) : result;
  }
  
  /**
   * Returns first node in hierarchy that contains a VariableCollection which
   * is part of the definition of the passed resource.
   * 
   * @param {module:meteoJS/modelviewer/resource.Resource} resource
   *   Resource.
   * @param {module:meteoJS/modelviewer/node.Node} node
   *   Search from 'node' and all the children.
   * @returns {undefined|module:meteoJS/modelviewer/node.Node}
   *   Node or undefined if no node is found.
   * @private
   */
  _getTopNodeOfResourceDefinition(resource, node) {
    if (resource.isDefinedByVariableOf(node.variableCollection))
      return node;
    let result = undefined;
    node.children.forEach(childNode => {
      if (result !== undefined)
        result = this._getTopNodeOfResourceDefinition(resource, childNode);
    });
    return result;
  }
  
  /**
   * Returns top most node for which on the way down (beginning from node)
   * all variables are contained by the VariableCollections of the travelled
   * nodes.
   * 
   * @param {module:meteoJS/modelviewer/variable.Variable} variables
   *   Variables which have still to be found.
   * @param {module:meteoJS/modelviewer/node.Node} node - Node.
   * @returns {undefined|module:meteoJS/modelviewer/node.Node} Child node.
   */
  _getTopMostChildWithAllVariables(variables, node, bubbleDown) {
    let isVariableContained = false;
    node.variableCollection.variables.forEach(variable => {
      let i = variables.indexOf(variable)
      if (i > -1) {
        isVariableContained = true;
        variables.splice(i, 1);
      }
    });
    if (variables.length == 0)
      return node;
    else if (node.children.length == 0)
      return undefined;
    else if (!isVariableContained &&
             bubbleDown)
      return undefined;
    let result = undefined;
    node.children.forEach(childNode => {
      if (result === undefined)
        result = this._getTopMostChildWithAllVariables(variables, childNode, bubbleDown);
    });
    return result;
  }
  
  /**
   * Returns node which contains the passed variableCollection
   * 
   * @param {module:meteoJS/modelviewer/variableCollection.VariableCollection}
   *   variableCollection
   *   VariableCollection.
   * @returns {module:meteoJS/modelviewer/node.Node} Node.
   */
  getNodeByVariableCollection(variableCollection) {
    let result = this._getNodeByVariableCollection(
      a => { return variableCollection === a; }
    );
    return (result === undefined) ? new Node(new VariableCollection()) : result;
  }
  
  /**
   * Returns node which contains the variableCollection with the passed Id.
   * 
   * @param {mixed} id - Id.
   * @returns {module:meteoJS/modelviewer/node.Node} Node.
   */
  getNodeByVariableCollectionId(id) {
    let result = this._getNodeByVariableCollection(
      a => { return id === a.id; }
    );
    return (result === undefined) ? new Node(new VariableCollection()) : result;
  }
  
  /**
   * Returns node which contains the passed variableCollection.
   * 
   * @param {Function} compareFunc - Argument is a VariableCollection-object.
   * @returns {undefined|module:meteoJS/modelviewer/node.Node} Node.
   * @private
   */
  _getNodeByVariableCollection(compareFunc) {
    return (compareFunc(this.topNode.variableCollection))
      ? this.topNode
      : this._findChildNodeByVariableCollection(compareFunc, this.topNode);
  }
  
  /**
   * Returns a VariableCollection with passed variableCollection of
   * node's children.
   * 
   * @param {Function} compareFunc - Argument is a VariableCollection-object.
   * @param {module:meteoJS/modelviewer/node.Node} parentNode
   *   Search recursively in this node's children.
   * @returns {undefined|module:meteoJS/modelviewer/node.Node} Node.
   * @private
   */
  _findChildNodeByVariableCollection(compareFunc, parentNode) {
    let result;
    parentNode.children.forEach(n => {
      if (result === undefined &&
          compareFunc(n.variableCollection)) {
        result = n;
        return;
      }
      if (n.children.length > 0)
        result = this._findChildNodeByVariableCollection(compareFunc, n);
    });
    return result;
  }
  
  /**
   * Appends an Image-resource. Alias for append(new Image(…)).
   * 
   * @see module:meteoJS/modelviewer/resource/image.Image
   * @returns {module:meteoJS/modelviewer/resources.Resources} This.
   */
  appendImage({ variables, datetime, run, offset, url }) {
    this.append(new Image({
      variables,
      datetime,
      run,
      offset,
      url
    }));
    return this;
  }
  
  /**
   * Returns an array of available Variable-Objects from a VariableCollection.
   * For this objects at least one resource is contained in this Resources-
   * Object. With 'variables' the resources will be limited. Only resources
   * which are assigned to these variables will be accounted.
   * 
   * @param {module:meteoJS/modelviewer/VariableCollection.VariableCollection}
   *   variableCollection
   *   Return Variables of this VariableCollection.
   * @param {module:meteoJS/modelviewer/Variable.Variable[]}
   *   Only 
   * @returns {module:meteoJS/modelviewer/Variable.Variable[]}
   *   Available variables.
   */
  getAvailableVariables(variableCollection, { variables = [] }) {
    let node = this.getNodeByVariableCollection(variableCollection);
    let resources = node.getResourcesByVariables(...variables);
    [].push.apply(resources, this._getResourcesOf(node, 'children', variables));
    [].push.apply(resources, this._getResourcesOf(node, 'parents', variables));
    let ids = {};
    let vars = variableCollection.variables;
    resources.forEach(resource => {
      vars = vars.filter(variable => {
        if (resource.isDefinedBy(variable, ...variables)) {
          ids[variable.id] = variable;
          return false;
        }
        else
          return true;
      });
    });
    return Object.keys(ids).map(id => ids[id]);
  }
  
  /**
   * Traverses all children respectively parents of the passed node. Collects
   * all resources in this traversed nodes, which are defined by all of the
   * passed variables. Returns this collected resources.
   * 
   * @param {module:meteoJS/modelviewer/node.Node} node - Node.
   * @param {string} key - 'children' or 'parents'.
   * @returns {module:meteoJS/modelviewer/resource.Resource[]} Resources.
   * @private
   */
  _getResourcesOf(node, key, variables) {
    let result = [];
    node[key].forEach(n => {
      [].push.apply(result, n.getResourcesByVariables(...variables));
      [].push.apply(result, this._getResourcesOf(n, key, variables));
    });
    return result;
  }
  
  getAllTimesByVariables(...variables) {
    let collectVariables = variables
    .filter(variable => {
      let result = false;
      this._collectTimesVariableCollections.forEach(collection => {
        if (collection.contains(variable))
          result = true;
      });
      return result;
    });
    if (collectVariables.length != this._collectTimesVariableCollections.length)
      return [];
    let node = this._getTopMostChildWithAllVariables(collectVariables.slice(), this.topNode, false);
    if (node === undefined)
      return [];
    let times = {};
    let fields = [];
    let collectTimes = node => {
      node.resources.forEach(resource => {
        if (resource.datetime !== undefined &&
            resource.isDefinedBy(...collectVariables))
          times[resource.datetime.valueOf()] = resource.datetime;
      });
      node.children.forEach(n => collectTimes(n));
    };
    collectTimes(node);
    return Object.keys(times).sort().map(i => { return times[i] });
  }
  
  /**
   * Returns timestamps of available resources. All these resources are defined
   * by the passes variables. With this method, one can get all available
   * timestamps of resources that have the same definition.
   * 
   * @param {...module:meteoJS/modelviewer/variable.Variable} variables
   *   Variables.
   * @returns {Date[]} - Times, sorted from older to newer.
   */
  getTimesByVariables(...variables) {
    return this._getTimesByVariables(true, ...variables);
  }
  
  /**
   * Returns timestamps of available resources. All these resources are defined
   * by the passes variables. With this method, one can get all available
   * timestamps of resources that have the same definition.
   * 
   * @param {...module:meteoJS/modelviewer/variable.Variable} variables
   *   Variables.
   * @returns {Date[]} - Times, sorted from older to newer.
   */
  getTimesByVariablesNoBubble(...variables) {
    return this._getTimesByVariables(false, ...variables);
  }
  
  /**
   * Returns timestamps of available resources. All these resources are defined
   * by the passes variables. With this method, one can get all available
   * timestamps of resources that have the same definition.
   * 
   * @param {boolean} bubbleDown
   *   Bubble through hierarchy even if a variable misses on some level.
   * @param {...module:meteoJS/modelviewer/variable.Variable} variables
   *   Variables.
   * @returns {Date[]} - Times, sorted from older to newer.
   * @private
   */
  _getTimesByVariables(bubbleDown, ...variables) {
    let node = this._getTopMostChildWithAllVariables(variables.slice(),
                                                     this.topNode,
                                                     bubbleDown);
    if (node === undefined)
      return [];
    let times = {};
    let fields = [];
    node.resources.forEach(resource => {
      if (resource.datetime !== undefined &&
          resource.isDefinedBy(...variables))
        times[resource.datetime.valueOf()] = resource.datetime;
    });
    return Object.keys(times).sort().map(i => { return times[i] });
  }
}
addEventFunctions(Resources.prototype);
export default Resources;