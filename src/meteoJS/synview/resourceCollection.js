/**
 * @module meteoJS/synview/resourceCollection
 */

/**
 * Collection of resource objects.
 * Extends meteoJS.synview.collection with storage of time objects.
 * 
 * @constructor
 * @augments meteoJS.synview.collection
 */
meteoJS.synview.resourceCollection = function () {
  meteoJS.synview.collection.call(this);
  
  /**
   * List of the datetime objects of the resources (sorted upwardly).
   * @member {Date[]}
   */
  this.times = [];
};
meteoJS.synview.resourceCollection.prototype = Object.create(meteoJS.synview.collection.prototype);
meteoJS.synview.resourceCollection.prototype.constructor = meteoJS.synview.resourceCollection;

/**
 * Returns resources with valid datetimes (ordered temporal upwardly).
 * 
 * @return {meteoJS.synview.resource[]} Resources.
 */
meteoJS.synview.resourceCollection.prototype.getResources = function () {
  return this.times.map(function (time) {
    return this.itemIds[time.valueOf()];
  }, this);
};

/**
 * Returns times (ordered temporal upwardly).
 * 
 * @return {Date[]} Times (no invalid times).
 */
meteoJS.synview.resourceCollection.prototype.getTimes = function () {
  return this.times;
};

/**
 * Returns resource valid at passed datetime (could be an invalid datetime).
 * If resource doesn't exist, an empty object is returned.
 * 
 * @param {Date} time Datetime.
 * @return {meteoJS.synview.resource} Resource.
 */
meteoJS.synview.resourceCollection.prototype.getResourceByTime = function (time) {
  var res = this.getItemById(isNaN(time) ? undefined : time.valueOf());
  return (res === undefined) ? new meteoJS.synview.resource() : res;
};

/**
 * Returns if a resource with passed time exists. Time could be invalid.
 * 
 * @param {Date} Time.
 * @return {boolean} If exists.
 */
meteoJS.synview.resourceCollection.prototype.containsTime = function (time) {
  return this.getIndexById(isNaN(time) ? undefined : time.valueOf()) > -1;
};

/**
 * Returns index of the resource with the passed time. Time could be invalid.
 * -1 if not existant.
 * 
 * @param {Date} time Time.
 * @return {integer} Index.
 */
meteoJS.synview.resourceCollection.prototype.getIndexByTime = function (time) {
  var result = -1;
  this.times.forEach(function (t, i) {
    if (t.valueOf() == time.valueOf())
      result = i;
  });
  return result;
};

/**
 * Returns if a resource with  ID exists in this collection.
 * 
 * @return {srfJS.synview.Core.Resource}
 */
meteoJS.synview.resourceCollection.prototype.getNewestResource = function () {
  if (this.times.length < 1)
    return new srfJS.synview.Core.Resource();
  return this.resources[this.times[this.times.length-1].valueOf()];
};

/**
 * Append a resource to the collection.
 * 
 * @augments meteoJS.synview.collection.append
 * @param {meteoJS.synview.resource} resource Resource.
 * @return {meteoJS.synview.resourceCollection} This.
 */
meteoJS.synview.resourceCollection.prototype.append = function (resource) {
  this._append(resource);
  this._sortTimes();
  return this;
};

/**
 * Exchanges the collection content with a list of resource.
 * 
 * @param {meteoJS.synview.resource[]} resources Resources.
 * @fires meteoJS.synview.collection#add:item
 * @fires meteoJS.synview.collection#replace:item
 * @fires meteoJS.synview.collection#remove:item
 * @return {meteoJS.synview.resourceCollection} This.
 */
meteoJS.synview.resourceCollection.prototype.swapResources = function (resources) {
  resources.forEach(function (resource, i) {
    this._append(resource);
  }, this);
  this._filterTimesByResources(resources);
  this._sortTimes();
  return this;
};

/**
 * Append a resource to the collection without reordering times-array.
 * 
 * @private
 * @param {meteoJS.synview.resource} resource Resource.
 */
meteoJS.synview.resourceCollection.prototype._append = function (resource) {
  var time = resource.getDatetime();
  var id = (time === undefined) ? undefined :
    (isNaN(time)) ? undefined: time.valueOf();
  if (this.containsId(id)) {
    this.trigger('replace:item', resource, this.getResourceById(id));
    this.items[id] = resource;
  }
  else {
    this.itemIds.push(id);
    this.items[id] = resource;
    if (time !== undefined && !isNaN(time))
      this.times.push(time);
    this.trigger('add:item', resource);
  }
};

/**
 * Removes all resources whose times doesn't exist in the collection.
 * 
 * @private
 * @param {meteoJS.synview.resource[]}
 */
meteoJS.synview.resourceCollection.prototype._filterTimesByResources = function (resources) {
  var filteredTimeIndexes = [];
  var containsResourceWithoutTime = false;
  this.times = this.times.filter(function (t) {
    var i = resources.findIndex(function (resource, i) {
      var time = resource.getDatetime();
      if (time !== undefined &&
          t.valueOf() == time.valueOf()) {
        result = true;
        filteredTimeIndexes.push(i);
      }
      else if (time === undefined)
        this.remove(time);
    }, this);
    if (i < 0) {
      this.trigger('remove:item', this.resources[t.valueOf()]);
      delete this.resources[t.valueOf()];
      filteredTimeIndexes.reverse().map(function (i) {
        this.times.splice(i, 1);
      }, this);
    }
    return result;
  }, this);
  
};

/**
 * Sortiert den Zeit-Array this.times der Reihe nach.
 * @private
 */
meteoJS.synview.resourceCollection.prototype._sortTimes = function () {
  this.times.sort(function (a, b) {
    return a.valueOf()-b.valueOf();
  });
};