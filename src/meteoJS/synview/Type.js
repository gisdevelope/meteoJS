/**
 * @module meteoJS/synview/type
 */

import $ from 'jquery';
import LayerGroup from 'ol/layer/Group';
import addEventFunctions from '../Events.js';
import ResourceCollection from './ResourceCollection.js';
import Resource from './Resource.js';

/**
 * Options for meteoJS/synview/type.
 * 
 * @typedef {Object} meteoJS/synview/type~options
 * @param {string|undefined} id ID.
 * @param {boolean} [visible] Visibility.
 * @param {undefined|number} [zIndex] zIndex on map.
 * @param {'nearest'|'floor'} [displayMethod]
 *   Method to determine the displayed resource.
 * @param {number} [displayMaxResourceAge]
 *   Maximum time space between display and resource time (in seconds).
 * @param {number} [displayFadeStart]
 *   Fade resource from this age to the display time (in seconds).
 * @param {number} [displayFadeStartOpacity]
 *   Opacity (between 0 and 1) at displayFadingTime.
 * @param {meteoJS/synview/tooltip~contentFunction|undefined} [tooltip]
 *   Tooltip function.
 */

/**
 * Triggered on change of visibilty.
 * 
 * @event meteoJS.synview.type#change:visible
 */

/**
 * Triggered, if the set of timestamps changes (due to resource changes).
 * 
 * @event meteoJS.synview.type#change:resources
 */

/**
 * Type to display by synview, like a serie of radar images.
 * 
 * @constructor
 * @param {meteoJS/synview/type~options} options Options.
 * requires openlayers Some code is dependent on the openlayers library.
 * @fires {meteoJS.synview.type#change:visible}
 */
export default class Type {
  
  constructor(options) {
    /**
     * Options.
     * @member {meteoJS/synview/type~options}
     */
    this.options = $.extend(true, {
      id: undefined,
      visible: true,
      zIndex: undefined,
      displayMethod: 'floor',
      displayMaxResourceAge: 3*3600,
      displayFadeStart: 15*60,
      displayFadeStartOpacity: 0.95,
      resources: undefined,
      tooltip: undefined
    }, options);
    
    /**
     * The mapping group to display all the resources. (openlayers specific)
     * @member {undefined|ol.layer.Group}
     * @default
     */
    this.layerGroup = undefined;
    
    /**
     * Collection of resources.
     * @member {meteoJS.synview.resourceCollection}
     */
    this.collection = new ResourceCollection();
    
    /**
     * Time of displayed resource.
     * @member {Date}
     */
    this.displayedResourceTime = new Date('invalid');
    
    // Collection initialisieren
    this.collection.on('add:item', function (resource) {
      this._addOLLayer(resource);
    }, this);
    this.collection.on('remove:item', function (resource) {
      this._removeOLLayer(resource);
    }, this);
    this.collection.on('replace:item', function (newResource, oldResource) {
      if (newResource !== oldResource)
        this._replaceOLLayer(newResource, oldResource);
    }, this);
    
    if (this.options.resources !== undefined)
      this.collection.setResources(this.options.resources);
    delete this.options.resources;
  }
  
  /**
   * Returns ID of type.
   * 
   * @return {string|undefined}
   */
  getId() {
    return this.options.id;
  }
  
  /**
   * Sets ID of type.
   * 
   * @param {string|undefined} id ID.
   * @return {meteoJS/synview/type} This.
   */
  setId(id) {
    this.options.id = id;
    return this;
  }
  
  /**
   * Returns visibility.
   * 
   * @return {boolean} Visibility.
   */
  getVisible() {
    return this.options.visible;
  }
  
  /**
   * Sets visibility.
   * 
   * @param {boolean} visible Visibility.
   * @return {meteoJS/synview/type} This.
   * @fires meteoJS.synview.type#change:visible
   */
  setVisible(visible) {
    // Nur etwas unternehmen, falls Visible ändert
    if (this.options.visible ? !visible : visible) {
      this.options.visible = visible ? true : false;
      if (this.layerGroup !== undefined)
        this.layerGroup.setVisible(this.options.visible);
      this.getResourceCollection().getItems().forEach(function (resource) {
        if (isNaN(resource.getDatetime()))
          resource.setVisible(this.options.visible);
        resource.setLayerGroup(this.options.visible ? this.layerGroup : undefined);
      }, this);
      this.trigger('change:visible');
    }
    return this;
  }
  
  /**
   * Returns the z Index.
   * 
   * @return {undefined|number}
   */
  getZIndex() {
    return this.options.zIndex;
  }
  
  /**
   * Sets the z Index.
   * 
   * @param {undefined|number} zIndex z-Index.
   * @return {meteoJS/synview/type} This.
   */
  setZIndex(zIndex) {
    this.options.zIndex = zIndex;
    if (this.layerGroup !== undefined)
      this.layerGroup.setZIndex(zIndex);
    this.getResourceCollection().getItems().forEach(function (resource) {
      resource.setZIndex(zIndex);
    });
    return this;
  }
  
  /**
   * Returns layer-group of this type on the map.
   * 
   * return {ol.layer.Group} Layer-group.
   */
  getLayerGroup() {
    return (this.layerGroup === undefined) ? new LayerGroup() : this.layerGroup;
  }
  
  /**
   * Sets map layer-group for this type.
   * 
   * @param {ol.layer.Group} group layer-group.
   * @return {meteoJS/synview/type} This.
   */
  setLayerGroup(group) {
    this.layerGroup = group;
    if (this.layerGroup !== undefined) {
      if ('setVisible' in this.layerGroup) // Leaflet doesn't know visibility
        this.layerGroup.setVisible(this.options.visible);
      this.layerGroup.setZIndex(this.options.zIndex);
    }
    this.getResourceCollection().getItems().forEach(function (resource) {
      resource.setLayerGroup(this.options.visible ? group : undefined);
    }, this);
    return this;
  }
  
  /**
   * Returns collection of the resources.
   * Note: If you directly append resources to the collection, no
   * meteoJS.synview.type#change:resources event will be fired.
   * 
   * @return {meteoJS.synview.resourceCollection} resourceCollection.
   */
  getResourceCollection() {
    return this.collection;
  }
  
  /**
   * Append a resource to the collection.
   * If type is visible, this might also change the resources on the map.
   * 
   * @param {meteoJS.synview.resource} resource Resource object.
   * @return {meteoJS/synview/type} This.
   * @fires meteoJS.synview.type#change:resources
   */
  appendResource(resource) {
    this.collection.append(resource);
    
    // show current layer again
    this.setDisplayTime(this.displayedResourceTime);
    
    /* Trigger event after setDisplayTime, therewith the synview object can
     * set the desired time in the timeline object. */
    this.trigger('change:resources');
    return this;
  }
  
  /**
   * Removes a resource from the collection.
   * If type is visible, this might also change the resources on the map.
   * 
   * @param {meteoJS.synview.resource} resource Resource object.
   * @return {meteoJS/synview/type} This.
   * @fires meteoJS.synview.type#change:resources
   */
  removeResource(resource) {
    // hide current layer
    this._hideVisibleResource();
    
    this.collection.remove(resource.getDatetime());
    
    // show current layer again
    this.setDisplayTime(this.displayedResourceTime);
    
    /* Trigger event after setDisplayTime, therewith the synview object can
     * set the desired time in the timeline object. */
    this.trigger('change:resources');
    return this;
  }
  
  /**
   * Sets resources in the collection (and replaces previous ones).
   * If type is visible, this might also change the resources on the map.
   * 
   * @param {meteoJS.synview.resource[]} resources List of resource objects.
   * @return {meteoJS/synview/type} This.
   * @fires meteoJS.synview.type#change:resources
   */
  setResources(resources) {
    // hide current layer
    this._hideVisibleResource();
    
    this.collection.setResources(resources);
    
    // show current layer again
    this.setDisplayTime(this.displayedResourceTime);
    
    /* Trigger event after setDisplayTime, therewith the synview object can
     * set the desired time in the timeline object. */
    this.trigger('change:resources');
    return this;
  }
  
  /**
   * Returns resource of the displayed resource. If type contains resources
   * with timestamps as well as a static resource, only a resource with timestamp
   * will be returned. If type is invisible or no layer group is set, no resource
   * is display, therefore an empty resource will be returned.
   * 
   * @return {meteoJS.synview.resource} Resource.
   */
  getDisplayedResource() {
    if (this.getVisible() &&
        this.layerGroup !== undefined) {
      if (isNaN(this.displayedResourceTime))
        return (this.collection.getTimes().length > 0) ?
          new Resource() :
          this.collection.getResourceByTime(this.displayedResourceTime);
      else
        return this.collection.getResourceByTime(this.displayedResourceTime);
    }
    else
      return new Resource();
  }
  
  /**
   * Sets time to display. Corresponding to the options an adequate resource will
   * be searched and displayed. (accessible via getDisplayedResource())
   * 
   * @param {Date} time Display time.
   * @return {meteoJS/synview/type} This.
   */
  setDisplayTime(time) {
    if (!this.getVisible())
      return this;
    var time_to_show = this._getResourceTimeByDisplayTime(time);
    if (time_to_show === undefined ||
        time_to_show !== undefined &&
        !isNaN(this.displayedResourceTime) &&
        this.displayedResourceTime.valueOf() != time_to_show.valueOf())
      this._hideVisibleResource();
    if (time_to_show !== undefined) {
      this.displayedResourceTime = time_to_show;
      var resource = this.getResourceCollection().getItemById(time_to_show.valueOf());
      if (resource.getId()) {
        resource.setVisible(true);
        var opacity = 1.0;
        if (Math.abs(time.valueOf() - time_to_show.valueOf()) > this.options.displayMaxResourceAge*1000) // 3h
          opacity = 0.0;
        else if (Math.abs(time.valueOf() - time_to_show.valueOf()) > this.options.displayFadeStart*1000) // 15min
          opacity = this.options.displayFadeStartOpacity *
            (Math.abs(time.valueOf() - time_to_show.valueOf()) -
             this.options.displayMaxResourceAge * 1000) /
            (1000 *
             (this.options.displayFadeStart - this.options.displayMaxResourceAge));
        resource.setOpacity(opacity);
      }
    }
    else
      this.displayedResourceTime = new Date('invalid');
    return this;
  }
  
  /**
   * Returns the current tooltip function, undefined for no tooltip.
   * 
   * @return {meteoJS/synview/tooltip~contentFunction|undefined} Tooltip function.
   */
  getTooltip() {
    return this.options.tooltip;
  }
  
  /**
   * Sets the tooltip function. Undefined for no tooltip.
   * 
   * @param {meteoJS/synview/tooltip~contentFunction|undefined} tooltip Tooltip function.
   * @return {meteoJS/synview/type} This.
   */
  setTooltip(tooltip) {
    this.options.tooltip = tooltip;
    return this;
  }
  
  /**
   * Sets style of all resources (if resource has 'setOLStyle' method).
   * If argument 'style' isn't declared, the style will be updated.
   * Convenience method, you could also loop over all resources.
   * 
   * @param {ol/style/Style~Style} [style] OpenLayers style.
   * @returns {meteoJS/synview/type} This.
   */
  setResourcesOLStyle(style) {
    var styleArguments = arguments;
    this.getResourceCollection().getItems().forEach(function (resource) {
      if ('setOLStyle' in resource)
        resource.setOLStyle.apply(resource, styleArguments);
    });
    return this;
  }
  
  /**
   * Blendet aktuell dargestellten OL-Layer aus.
   * @private
   */
  _hideVisibleResource() {
    if (!isNaN(this.displayedResourceTime))
      this.getResourceCollection()
        .getItemById(this.displayedResourceTime.valueOf())
        .setVisible(false);
  }
  
  /**
   * Füge dem layers-Objekt einen neuen OL-Layer hinzu
   * @private
   * @param {meteoJS.synview.resource} resource Entsprechende Resource zum Hinzufügen
   */
  _addOLLayer(resource) {
    // Show static resources if visible
    if (isNaN(resource.getDatetime()))
      resource.setVisible(this.getVisible());
    resource.setLayerGroup(this.getLayerGroup());
    resource.setZIndex(this.options.zIndex);
  }
  
  /**
   * Löscht aus layers-Objekt einen OL-Layer
   * @private
   * @param {meteoJS.synview.resource} resource Entsprechende Resource zum Hinzufügen
   */
  _removeOLLayer(resource) {
    resource.setLayerGroup(undefined);
  }
  
  /**
   * Ersetzt im layers-Objekt einen OL-Layer
   * @private
   * @param {meteoJS.synview.resource} newResource Resource zum Hinzufügen
   * @param {meteoJS.synview.resource} oldResource Resource zum Ersetzen
   */
  _replaceOLLayer(newResource, oldResource) {
    this._removeOLLayer(oldResource);
    this._addOLLayer(newResource);
  }
  
  /**
   * Gibt eine Zeit mit vorhandener Resource zu einer darzustellenden Zeit zurück.
   * Es gibt dazu verschiedene Optionen (this.options.displayMethod):
   * 'nearest': Wähle die zeitlich nächstgelegene Resource aus
   * 'floor':   Wähle die Resource direkt zum Zeitpunkt oder zeitlich direkt vor
   *            dem Termin.
   * @private
   * @return {undefined|Date} Resource time or undefined if not existing.
   */
  _getResourceTimeByDisplayTime(time) {
    if (isNaN(time))
      return undefined;
    var resultTime = undefined;
    this.collection.getTimes().forEach(function (resourceTime) {
      /*if (resultTime === undefined)
        resultTime = resourceTime;
      else {*/
        switch (this.options.displayMethod) {
          case 'exact':
            if (time.valueOf() == resourceTime.valueOf())
              resultTime = resourceTime;
            break;
          case 'nearest':
            if (resultTime === undefined ||
                Math.abs(time.valueOf() - resourceTime.valueOf()) <
                  Math.abs(time.valueOf() - resultTime.valueOf()))
              resultTime = resourceTime;
            break;
          case 'floor':
          default:
            if (resultTime === undefined ||
                resourceTime.valueOf() <= time.valueOf() &&
                (time.valueOf() - resourceTime.valueOf() <
                 time.valueOf() - resultTime.valueOf()))
              resultTime = resourceTime;
        }
      //}
    }, this);
    return resultTime;
  }
  
}
addEventFunctions(Type.prototype);