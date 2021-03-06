﻿const assert = require("assert");
import 'jsdom-global/register';
import $ from 'jquery';
import Animation from '../../../../src/meteoJS/timeline/Animation.js';
import ToggleButton
  from '../../../../src/meteoJS/timeline/animation/ToggleButton.js';

describe('Animation class, import via default', () => {
  it('button tests', () => {
    let animation = new Animation();
    
    let btn1 = $('<button>');
    new ToggleButton({
      animation: animation,
      node: btn1
    });
    assert.equal(btn1.prop('class'), '', 'No class #1');
    assert.equal(btn1.text(), '▶', 'Default stopped content #1'); // ▶
    btn1.click()
    assert.equal(btn1.prop('class'), '', 'No class #2');
    assert.equal(btn1.text(), '⏸', 'Default started content #1'); // ⏸
    btn1.click()
    assert.equal(btn1.prop('class'), '', 'No class #3');
    assert.equal(btn1.text(), '▶', 'Default stopped content #2'); // ▶
    
    let btn2 = $('<button>');
    new ToggleButton({
      animation: animation,
      node: btn2,
      startedContent: 'started',
      stoppedContent: 'stopped'
    });
    assert.equal(btn2.prop('class'), '', 'No class');
    assert.equal(btn2.text(), 'stopped', 'Stopped content #1');
    btn2.click()
    assert.equal(btn2.prop('class'), '', 'No class');
    assert.equal(btn2.text(), 'started', 'Started content #1');
    btn2.click()
    assert.equal(btn2.prop('class'), '', 'No class');
    assert.equal(btn2.text(), 'stopped', 'Stopped content #2');
    
    let btn3 = $('<button>');
    new ToggleButton({
      animation: animation,
      node: btn3,
      startedClass: 'started',
      startedContent: undefined,
      stoppedClass: 'stopped',
      stoppedContent: undefined
    });
    assert.equal(btn3.prop('class'), 'stopped', 'Stopped class #1');
    assert.equal(btn3.text(), '', 'No content');
    btn3.click()
    assert.equal(btn3.prop('class'), 'started', 'Started class #1');
    assert.equal(btn3.text(), '', 'No content');
    btn3.click()
    assert.equal(btn3.prop('class'), 'stopped', 'Stopped class #2');
    assert.equal(btn3.text(), '', 'No content');
    
    let btn4 = $('<button>');
    let startedContent = $('<span>').text('a');
    new ToggleButton({
      animation: animation,
      node: btn4,
      startedClass: 'started',
      startedContent: startedContent,
      stoppedClass: 'stopped',
      stoppedContent: $('<span>').text('b')
    });
    assert.equal(btn4.prop('class'), 'stopped', 'Stopped class #1');
    assert.equal(btn4.children().length, 1, '1 child #1');
    assert.equal(btn4.children().text(), 'b', 'Stopped Content #1');
    btn4.click()
    assert.equal(btn4.prop('class'), 'started', 'Started class #1');
    assert.equal(btn4.children().length, 1, '1 child #2');
    assert.equal(btn4.children().text(), 'a', 'Started Content #1');
    startedContent.text('c');
    assert.equal(btn4.children().text(), 'c', 'Started Content #2');
    btn4.click()
    assert.equal(btn4.prop('class'), 'stopped', 'Stopped class #2');
    assert.equal(btn4.children().length, 1, '1 child #3');
    assert.equal(btn4.children().text(), 'b', 'Stopped Content #2');
    
    let div1 = $('<div>');
    new ToggleButton({
      animation: animation,
      node: div1,
      menu: false
    });
    assert.equal(div1.children().length, 1, '1 element inside div');
    assert.equal(div1.children('button').length, 1, 'Button added to div');
  });
  it('dropdown menu', () => {
    let animation = new Animation();
    let div = $('<div>');
    new ToggleButton({
      animation: animation,
      node: div,
      classDropdownToggle: 'btn-dark',
      menuFrequencies: [1,5,40]
    });
    assert.equal(div.children().length, 3, '3 elements inside div');
    assert.equal(div.children('button').length, 2, '2 Buttons added to div');
    assert.ok(div.find('button.dropdown-toggle').hasClass('btn-dark'), 'dropdown-toggle class added');
    assert.equal(div.find('div.dropdown-menu input').length, 3, '3 inputs to menu');
    assert.equal(animation.getImageFrequency(), 5, 'image freq. 5 fps');
    assert.equal(div.find('div.dropdown-menu input[type=number]').first().val(), 5, 'input = 5fps');
    assert.equal(div.find('div.dropdown-menu input[type=range]').val(), 1, 'range = 5fps');
    assert.equal(animation.getRestartPause(), 1.8, 'restart pause 1.8s');
    assert.equal(div.find('div.dropdown-menu input[type=number]').last().val(), 1.8, 'input = 1.8s');
    animation.setImageFrequency(1);
    animation.setRestartPause(0);
    assert.equal(div.find('div.dropdown-menu input[type=number]').first().val(), 1, 'input = 1fps');
    assert.equal(div.find('div.dropdown-menu input[type=range]').val(), 0, 'range = 1fps');
    assert.equal(div.find('div.dropdown-menu input[type=number]').last().val(), 0, 'input = 0s');
    animation.setImageFrequency(40);
    animation.setRestartPause(3);
    assert.equal(div.find('div.dropdown-menu input[type=number]').first().val(), 40, 'input = 40fps');
    assert.equal(div.find('div.dropdown-menu input[type=range]').val(), 2, 'range = 40fps');
    assert.equal(div.find('div.dropdown-menu input[type=number]').last().val(), 3, 'input = 3s');
    animation.setImageFrequency(10);
    assert.equal(div.find('div.dropdown-menu input[type=number]').first().val(), 10, 'input = 10fps');
    assert.equal(div.find('div.dropdown-menu input[type=range]').val(), 2, 'range not chagned');
  });
});