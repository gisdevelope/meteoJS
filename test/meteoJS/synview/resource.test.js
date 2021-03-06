﻿import assert from 'assert';
import Group from 'ol/layer/Group';
import Resource from '../../../src/meteoJS/synview/Resource.js';

it('different use cases', () => {
  let res = new Resource();
  assert.equal(res.getId(), undefined, 'empty ID');
  assert.equal(res.getUrl(), undefined, 'undefined Url');
  assert.equal(res.getDatetime(), undefined, 'undefined Datetime');
  assert.equal(res.getMIMEType(), 'application/octet-stream', 'MIME-Type');
  assert.equal(res.layer, undefined, 'Internal layer undefined');
  assert.notEqual(res.getOLLayer(), undefined, 'Default layer');
  assert.notEqual(res.layer, undefined, 'Layer created');
  assert.equal(res.getVisible(), false, 'not visible');
  assert.equal(res.getZIndex(), undefined, 'undefined zIndex');
  assert.equal(res.getOpacity(), 1, 'Opacity = 1');
  
  let res1 = new Resource({
    url: 'http://www.example.com',
    datetime: new Date('2018-08-09T00:00:00.000Z'),
    mimetype: 'image/png'
  });
  assert.equal(res1.getId(), 'http://www.example.com', 'Url=ID');
  assert.equal(res1.getUrl(), 'http://www.example.com', 'Url');
  assert.equal(res1.getDatetime().toISOString(), '2018-08-09T00:00:00.000Z', 'Datetime');
  assert.equal(res1.getMIMEType(), 'image/png', 'MIME-Type');
  assert.equal(res1.layer, undefined, 'Internal layer undefined');
  assert.notEqual(res1.getOLLayer(), undefined, 'Default layer');
  assert.notEqual(res1.layer, undefined, 'Layer created');
  assert.equal(res1.getVisible(), false, 'not visible');
  assert.equal(res1.getZIndex(), undefined, 'undefined zIndex');
  assert.equal(res1.getOpacity(), 1, 'Opacity = 1');
  
  let res2 = new Resource({
    url: 'http://www.example.com',
    datetime: new Date('2018-08-09T00:00:00.000Z'),
    mimetype: 'image/png',
    ol: {
      source: undefined,
      events: undefined
    }
  });
  assert.equal(res2.getId(), 'http://www.example.com', 'Url=ID');
  assert.equal(res2.getUrl(), 'http://www.example.com', 'Url');
  assert.equal(res2.getDatetime().toISOString(), '2018-08-09T00:00:00.000Z', 'Datetime');
  assert.equal(res2.getMIMEType(), 'image/png', 'MIME-Type');
  assert.equal(res2.layer, undefined, 'Internal layer undefined');
  assert.notEqual(res2.getOLLayer(), undefined, 'Default layer');
  assert.notEqual(res2.layer, undefined, 'Layer created');
  assert.equal(res2.getVisible(), false, 'not visible');
  assert.equal(res2.getZIndex(), undefined, 'undefined zIndex');
  assert.equal(res2.getOpacity(), 1, 'Opacity = 1');
  
  let res3 = new Resource({
    url: 'http://www.example.com',
    datetime: new Date('2018-08-09T00:00:00.000Z'),
    mimetype: 'image/png',
    ol: {
      source: undefined,
      events: {
        'postcompose': function () {}
      }
    }
  });
  assert.equal(res3.getId(), 'http://www.example.com', 'Url=ID');
  assert.equal(res3.getUrl(), 'http://www.example.com', 'Url');
  assert.equal(res3.getDatetime().toISOString(), '2018-08-09T00:00:00.000Z', 'Datetime');
  assert.equal(res3.getMIMEType(), 'image/png', 'MIME-Type');
  assert.equal(res3.layer, undefined, 'Internal layer undefined');
  // My phantomjs doesn't know bind...
  if (Function.prototype.bind) {
    assert.notEqual(res3.getOLLayer(), undefined, 'Default layer');
    assert.notEqual(res3.layer, undefined, 'Layer created');
  }
  assert.equal(res3.getVisible(), false, 'not visible');
  assert.equal(res3.getZIndex(), undefined, 'undefined zIndex');
  assert.equal(res3.getOpacity(), 1, 'Opacity = 1');
});
it('setLayerGroup', () => {
  let res = new Resource({
    url: 'http://www.example.com',
    datetime: new Date('2018-08-09T00:00:00.000Z'),
    mimetype: 'image/png'
  });
  assert.equal(res.layer, undefined, 'Internal layer undefined');
  assert.equal(res.getVisible(), false, 'not visible');
  assert.equal(res.getZIndex(), undefined, 'undefined zIndex');
  assert.equal(res.getOpacity(), 1, 'Opacity = 1');
  res.setVisible(true);
  res.setZIndex(5);
  res.setOpacity(0.5);
  assert.equal(res.getVisible(), true, 'not visible');
  assert.equal(res.getZIndex(), 5, 'undefined zIndex');
  assert.equal(res.getOpacity(), 0.5, 'Opacity = 1');
  let layerGroup = new Group();
  res.setLayerGroup(layerGroup);
  assert.equal(layerGroup.getLayers().getLength(), 1, '1 layer in group');
  assert.notEqual(res.layer, undefined, 'layer created');
  assert.equal(res.getVisible(), true, 'not visible');
  assert.equal(res.getZIndex(), 5, 'undefined zIndex');
  assert.equal(res.getOpacity(), 0.5, 'Opacity = 1');
  res.setLayerGroup(layerGroup);
  assert.equal(layerGroup.getLayers().getLength(), 1, '1 layer in group');
  assert.notEqual(res.layer, undefined, 'layer created');
  assert.equal(res.getVisible(), true, 'not visible');
  assert.equal(res.getZIndex(), 5, 'undefined zIndex');
  assert.equal(res.getOpacity(), 0.5, 'Opacity = 1');
  res.setLayerGroup(undefined);
  assert.equal(layerGroup.getLayers().getLength(), 0, '0 layer in group');
  assert.equal(res.layer, undefined, 'Internal layer undefined');
});