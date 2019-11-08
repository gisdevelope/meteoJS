﻿import assert from 'assert';
import { makeResources, fillImageResources } from './helperCreateResources.js';
import Variable from '../../../src/meteoJS/modelviewer/Variable.js';
import TimeVariable from '../../../src/meteoJS/modelviewer/TimeVariable.js';
import VariableCollection from '../../../src/meteoJS/modelviewer/VariableCollection.js';
import Node from '../../../src/meteoJS/modelviewer/Node.js';
import Resource from '../../../src/meteoJS/modelviewer/Resource.js';
import Resources from '../../../src/meteoJS/modelviewer/Resources.js';
import { Resources as ResourcesClass } from '../../../src/meteoJS/modelviewer/Resources.js';

describe('Resources class, import via default', () => {
  it('topNode', () => {
    let topNode = new Node(new VariableCollection({ id: 'test' }));
    let resources = new Resources({ topNode });
    assert.ok(resources.topNode === topNode, 'topNode');
  });
  it('variableCollections', () => {
    let vcA = new VariableCollection({ id: 'testA' });
    let vcB = new VariableCollection({ id: 'testB' });
    let vcC = new VariableCollection({ id: 'testC' });
    let vcD = new VariableCollection({ id: 'testD' });
    let vcE = new VariableCollection({ id: 'testE' });
    let vcF = new VariableCollection({ id: 'testF' });
    let topNode = new Node(vcA);
    let nodeB = new Node(vcB);
    topNode.appendChild(nodeB, new Node(vcC));
    let nodeE = new Node(vcE);
    nodeB.appendChild(new Node(vcD), nodeE);
    nodeE.appendChild(new Node(vcF));
    let resources = new Resources({ topNode });
    assert.equal(resources.variableCollections.length, 6, 'count of collections');
    assert.ok(resources.variableCollections.indexOf(vcA) > -1, 'vcA');
    assert.ok(resources.variableCollections.indexOf(vcB) > -1, 'vcB');
    assert.ok(resources.variableCollections.indexOf(vcC) > -1, 'vcC');
    assert.ok(resources.variableCollections.indexOf(vcD) > -1, 'vcD');
    assert.ok(resources.variableCollections.indexOf(vcE) > -1, 'vcE');
    assert.ok(resources.variableCollections.indexOf(vcF) > -1, 'vcF');
  });
  it('getNodeByVariableCollection', () => {
    let vcA = new VariableCollection({ id: 'testA' });
    let vcB = new VariableCollection({ id: 'testB' });
    let vcC = new VariableCollection({ id: 'testC' });
    let topNode = new Node(vcA);
    topNode.appendChild(new Node(vcB), new Node(vcC));
    let resources = new Resources({ topNode });
    assert.equal(
      resources.getNodeByVariableCollection(vcA).variableCollection.id,
      'testA', 'vcA');
    assert.equal(
      resources.getNodeByVariableCollection(vcB).variableCollection.id,
      'testB', 'vcB');
    assert.equal(
      resources.getNodeByVariableCollection(vcC).variableCollection.id,
      'testC', 'vcC');
    assert.equal(
      resources.getNodeByVariableCollection(new VariableCollection({ id: ''})).variableCollection.id,
      undefined, 'unknown collection');
    assert.equal(
      resources.getNodeByVariableCollection(new VariableCollection({ id: 'testB'})).variableCollection.id,
      undefined, 'unknown collection');
    assert.equal(
      resources.getNodeByVariableCollectionId('testA').variableCollection.id,
      'testA', 'ID testA');
    assert.equal(
      resources.getNodeByVariableCollectionId('testB').variableCollection.id,
      'testB', 'ID testB');
    assert.equal(
      resources.getNodeByVariableCollectionId('testC').variableCollection.id,
      'testC', 'ID testC');
    assert.equal(
      resources.getNodeByVariableCollectionId(new VariableCollection({ id: ''})).variableCollection.id,
      undefined, 'unknown id');
  });
  it('append/getAvailableVariables/remove/availableVariablesMap', () => {
    let models = new VariableCollection({ id: 'models' });
    models.append(
      new Variable({ id: 'ECMWF' }),
      new Variable({ id: 'GFS' })
    );
    let ECmodel = models.getVariableById('ECMWF');
    assert.equal(ECmodel.id, 'ECMWF', 'ECMWF variable');
    let runs = new VariableCollection({ id: 'runs' });
    runs.append(
      new TimeVariable({ datetime: new Date(Date.UTC(2019, 9, 26, 0)) }),
      new TimeVariable({ datetime: new Date(Date.UTC(2019, 9, 25, 12)) }),
      new TimeVariable({ datetime: new Date(Date.UTC(2019, 9, 25, 0)) })
    );
    assert.equal(runs.items.length, 3, '3 runs');
    let fields = new VariableCollection({ id: 'fields' });
    fields.append(
      new Variable({ id: 'precipitation' }),
      new Variable({ id: 'geopotential' }),
      new Variable({ id: 'wind' })
    );
    let offsets = new VariableCollection({ id: 'offsets' });
    offsets.append(
      new Variable({ id: 0 }),
      new Variable({ id: 3 }),
      new Variable({ id: 6 }),
      new Variable({ id: 9 }),
      new Variable({ id: 12 }),
      new Variable({ id: 15 }),
      new Variable({ id: 18 }),
      new Variable({ id: 21 }),
      new Variable({ id: 24 })
    );
    let modelNode = new Node(models);
    let runNode = new Node(runs);
    let fieldNode = new Node(fields);
    let offsetNode = new Node(offsets);
    modelNode.appendChild(runNode.appendChild(fieldNode.appendChild(offsetNode)));
    let resources = new Resources({ topNode: modelNode });
    let changeResourcesCount = 0;
    let addedResourcesCount = 0;
    let removedResourcesCount = 0;
    resources.on('change:resources', ({ addedResources = [], removedResources = [] }) => {
      changeResourcesCount++
      addedResourcesCount += addedResources.length;
      removedResourcesCount += removedResources.length;
    });
    assert.equal(
      resources.getNodeByVariableCollection(models).variableCollection.id,
      'models', 'find models collection');
    assert.equal(
      resources.getNodeByVariableCollection(runs).variableCollection.id,
      'runs', 'find runs collection');
    assert.equal(
      resources.getNodeByVariableCollection(fields).variableCollection.id,
      'fields', 'find fields collection');
    assert.equal(
      resources.getNodeByVariableCollection(offsets).variableCollection.id,
      'offsets', 'find offsets collection');
    models.items.forEach(model => {
      runs.items.forEach(run => {
        fields.items.forEach(field => {
          offsets.items.forEach(offset => {
            resources.append(new Resource({
              variables: [model, run, field, offset]
            }));
          });
        });
      });
    });
    assert.equal(modelNode.resources.length, 0, '0 resources in models');
    assert.equal(runNode.resources.length, 0, '0 resources in runs');
    assert.equal(fieldNode.resources.length, 0, '0 resources in fields');
    assert.equal(offsetNode.resources.length, 162, '162 resources in offsets');
    assert.equal(offsetNode._resources.size, 4, 'internal: Count of elements in Map _resources');
    for (let s of offsetNode._resources.values())
      assert.equal(s.size, 162, 'internal: Count of resources in each Map-element in _resources');
    assert.equal(changeResourcesCount, 162, 'changeResourcesCount');
    assert.equal(addedResourcesCount, 162, 'addedResourcesCount');
    assert.equal(removedResourcesCount, 0, 'removedResourcesCount');
    let EC_runs =
      resources.getAvailableVariables(runs, { variables: [ECmodel] });
    assert.equal(EC_runs.length, 3, '3 available ECMWF-Runs');
    assert.equal(offsetNode.getResourcesByVariables(offsets.getItemById(0)).length, 18, '18 resources with offset 0');
    assert.equal(offsetNode.getResourcesByVariables(offsets.getItemById(3)).length, 18, '18 resources with offset 3');
    assert.equal(resources.availableVariablesMap.size, 4, '4 elements in availableVariablesMap');
    assert.equal(resources.availableVariablesMap.get(modelNode).size, 2, '2 models with available resources');
    assert.equal(resources.availableVariablesMap.get(runNode).size, 3, '3 runs with available resources');
    assert.equal(resources.availableVariablesMap.get(fieldNode).size, 3, '3 fields with available resources');
    assert.equal(resources.availableVariablesMap.get(offsetNode).size, 9, '9 offsets with available resources');
    resources.remove(...resources
      .getNodeByVariableCollection(offsets)
      .resources
      .filter(resource =>
        resource.getVariableByVariableCollection(models).id == 'ECMWF' &&
        !(resource.getVariableByVariableCollection(offsets).id % 12)));
    assert.equal(offsetNode.resources.length, 135, '135 resources in offsets');
    assert.equal(offsetNode.getResourcesByVariables(offsets.getItemById(0)).length, 9, '9 resources with offset 0');
    assert.equal(offsetNode.getResourcesByVariables(offsets.getItemById(3)).length, 18, '18 resources with offset 3');
    assert.equal(resources.availableVariablesMap.size, 4, '4 elements in availableVariablesMap');
    assert.equal(resources.availableVariablesMap.get(modelNode).size, 2, '2 models with available resources');
    assert.equal(resources.availableVariablesMap.get(runNode).size, 3, '3 runs with available resources');
    assert.equal(resources.availableVariablesMap.get(fieldNode).size, 3, '3 fields with available resources');
    assert.equal(resources.availableVariablesMap.get(offsetNode).size, 9, '9 offsets with available resources');
    assert.equal(changeResourcesCount, 163, 'changeResourcesCount');
    assert.equal(addedResourcesCount, 162, 'addedResourcesCount');
    assert.equal(removedResourcesCount, 27, 'removedResourcesCount');
    resources.remove(...resources
      .getNodeByVariableCollection(offsets)
      .resources
      .filter(resource =>
        !(resource.getVariableByVariableCollection(offsets).id % 12)));
    assert.equal(offsetNode.resources.length, 108, '135 resources in offsets');
    assert.equal(offsetNode.getResourcesByVariables(offsets.getItemById(0)).length, 0, '0 resources with offset 0');
    assert.equal(offsetNode.getResourcesByVariables(offsets.getItemById(3)).length, 18, '18 resources with offset 3');
    assert.equal(resources.availableVariablesMap.size, 4, '4 elements in availableVariablesMap');
    assert.equal(resources.availableVariablesMap.get(modelNode).size, 2, '2 models with available resources');
    assert.equal(resources.availableVariablesMap.get(runNode).size, 3, '3 runs with available resources');
    assert.equal(resources.availableVariablesMap.get(fieldNode).size, 3, '3 fields with available resources');
    assert.equal(resources.availableVariablesMap.get(offsetNode).size, 6, '6 offsets with available resources');
    assert.equal(changeResourcesCount, 164, 'changeResourcesCount');
    assert.equal(addedResourcesCount, 162, 'addedResourcesCount');
    assert.equal(removedResourcesCount, 54, 'removedResourcesCount');
  });
  it('getTopMostNodeWithAllVariables', () => {
    let resources = makeResources();
    let model = resources.getNodeByVariableCollectionId('models')
      .variableCollection.getItemById('ECMWF');
    let date = new Date(Date.UTC(2019, 10, 3));
    let run = resources.getNodeByVariableCollectionId('runs')
      .variableCollection.getItemById(date.valueOf());
    let field = resources.getNodeByVariableCollectionId('fields')
      .variableCollection.getItemById('wind');
    let level = resources.getNodeByVariableCollectionId('levels')
      .variableCollection.getItemById('500hPa');
    assert.equal(resources.getTopMostNodeWithAllVariables().variableCollection.id, 'models');
    assert.equal(resources.getTopMostNodeWithAllVariables(model).variableCollection.id, 'models');
    assert.equal(resources.getTopMostNodeWithAllVariables(run).variableCollection.id, 'runs');
    assert.equal(resources.getTopMostNodeWithAllVariables(field).variableCollection.id, 'fields');
    assert.equal(resources.getTopMostNodeWithAllVariables(level).variableCollection.id, 'levels');
    assert.equal(resources.getTopMostNodeWithAllVariables(model, run).variableCollection.id, 'runs');
    assert.equal(resources.getTopMostNodeWithAllVariables(model, run, field).variableCollection.id, 'fields');
    assert.equal(resources.getTopMostNodeWithAllVariables(model, run, level).variableCollection.id, 'levels');
    assert.equal(resources.getTopMostNodeWithAllVariables(model, run, field, level).variableCollection.id, 'levels');
    assert.equal(resources.getTopMostNodeWithAllVariables(field, level).variableCollection.id, 'levels');
    assert.equal(resources.getTopMostNodeWithAllVariables(model, field).variableCollection.id, 'fields');
    assert.equal(resources.getTopMostNodeWithAllVariables(new Variable()).variableCollection.id, undefined, 'no variableCollection');
    assert.equal(resources.getTopMostNodeWithAllVariables(model, run, new Variable()).variableCollection.id, undefined, 'no variableCollection');
  });
  it('getTimesByVariables(NoBubble)', () => {
    let resources = makeResources();
    fillImageResources(resources);
    let date = new Date(Date.UTC(2019, 10, 3));
    let model = resources.getNodeByVariableCollectionId('models')
      .variableCollection.getItemById('ECMWF');
    assert.equal(model.id, 'ECMWF', 'model id');
    let run = resources.getNodeByVariableCollectionId('runs')
      .variableCollection.getItemById(date.valueOf());
    assert.equal(run.datetime.valueOf(), date.valueOf(), 'run id');
    let field = resources.getNodeByVariableCollectionId('fields')
      .variableCollection.getItemById('wind');
    assert.equal(field.id, 'wind', 'wind id');
    let geopot = resources.getNodeByVariableCollectionId('fields')
      .variableCollection.getItemById('geopotential');
    assert.equal(geopot.id, 'geopotential', 'geopot id');
    let level = resources.getNodeByVariableCollectionId('levels')
      .variableCollection.getItemById('500hPa');
    assert.equal(level.id, '500hPa', 'level id');
    assert.equal(resources.getTimesByVariables(model, run).length, 0, 'No resources for model, wind');
    assert.equal(resources.getTimesByVariablesNoBubble(model, run).length, 0, 'No resources for model, wind');
    let times = resources.getTimesByVariables(model, run, field, level);
    assert.equal(times.length, 25, 'Resources for model, wind, field, level');
    assert.ok(times[0].valueOf() < times[1].valueOf(), 'Sorted upward');
    let timesNoBubble = resources.getTimesByVariablesNoBubble(model, run, field, level);
    assert.equal(timesNoBubble.length, 25, 'Resources for model, wind, field, level');
    assert.ok(timesNoBubble[0].valueOf() < timesNoBubble[1].valueOf(), 'Sorted upward');
    assert.equal(resources.getTimesByVariables(model, run, geopot, level).length, 13, 'Resources for model, wind, geopot, level');
    assert.equal(resources.getTimesByVariables(field).length, 0, 'Resources for field');
    assert.equal(resources.getTimesByVariables(level).length, 33, 'Resources for level');
    assert.equal(resources.getTimesByVariables(field, level).length, 33, 'Resources for field,level');
    assert.equal(resources.getTimesByVariablesNoBubble(model, run, geopot, level).length, 13, 'Resources for model, wind, geopot, level');
    assert.equal(resources.getTimesByVariablesNoBubble(field).length, 0, 'Resources for field');
    assert.equal(resources.getTimesByVariablesNoBubble(level).length, 0, 'Resources for level');
    assert.equal(resources.getTimesByVariablesNoBubble(field, level).length, 0, 'Resources for field,level');
  });
});
describe('Resources class, import via name', () => {
  it('simple', () => {
    let resources = new Resources({
      topNode: new Node(new VariableCollection())
    });
  });
});