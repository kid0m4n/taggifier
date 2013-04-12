var Q = require('q')
  , _ = require('underscore')
  , jsdom = require('jsdom').jsdom
  , whiteSpaceRegex = /\s/
  , longWhiteSpaceRegex = /\s{2,1000}/g
  , ignoredNodeIds = ['inlinetermTerm', 'inlinedialog']
  , ignoredNodeTypes = ['SCRIPT', '#comment']

var Taggifier = module.exports = function(opts) {
  this._opts = _.extend({
    tag: 'span',
    className: 'highlightableElement',
    idPrefix: 'textHighlight',
    counterSeparator: '_',
    start: 0
  }, opts || {})
}

Taggifier.prototype.end = function() {
  this._opts = null
}

Taggifier.prototype.process = function(html) {
  var self = this

  self._counter = self._opts.start

  return Q.ninvoke(jsdom, 'env', { html: html })
  .then(function(window) {
    var processHtml = self._surroundWithTags(window)
    window.close()

    return processHtml
  })
}

Taggifier.prototype._surroundWithTags = function(window) {
  var document = window.document
    , body = document.getElementsByTagName('body')[0]
    , nodesToVisit = []
    , currentNode
    , replacementText
    , replacementNode
    , parentNode

  _(body.childNodes).each(function(childNode) {
    nodesToVisit.push(childNode)
  })

  while (nodesToVisit.length > 0) {
    currentNode = nodesToVisit.shift()

    if (notHighlightable(currentNode)) {
      continue
    }

    if (isTextNode(currentNode)) {
      replacementText = this._surroundTextWithTags.call(this, currentNode.data)
      replacementNode = createFragment(document, replacementText)
      parentNode = currentNode.parentNode

      parentNode.replaceChild(replacementNode, currentNode)
    } else if (isElementNode(currentNode)) {
      _.chain(currentNode.childNodes).toArray().reverse().each(function(childNode) {
        nodesToVisit.unshift(childNode)
      })
    }
  }

  return document.innerHTML
}

Taggifier.prototype._surroundTextWithTags = function(text) {
  var self = this
    , allWords = text.match(/(&nbsp;|\S+)/g)
    , replacements = []
    , firstWordStartsWithSpace = text.match(/^\s/)
    , lastWordEndsWithSpace = text.match(/\s$/)

  _.chain(allWords).each(function(word, i) {
    var isFirst = i === 0
      , isLast = i === allWords.length - 1

    replacements.push(self._convert(word, isFirst, isLast, firstWordStartsWithSpace, lastWordEndsWithSpace))
  })

  return replacements.join("")
}

Taggifier.prototype._convert = function(word, isFirst, isLast, firstWordStartsWithSpace, lastWordEndsWithSpace) {
  var replacements = []
    , addSpaceBeforeFirstWord = isFirst && firstWordStartsWithSpace
    , wordIsNotTheLastOneOrTheLastWordEndsWithSpace = lastWordEndsWithSpace || !isLast

  if (addSpaceBeforeFirstWord) {
    replacements.push(this._createWrappedAnnotatableText('&nbsp;'))
  }

  replacements.push(this._createWrappedAnnotatableText(word))

  if (wordIsNotTheLastOneOrTheLastWordEndsWithSpace) {
    replacements.push(this._createWrappedAnnotatableText('&nbsp;'))
  }

  return replacements.join("")
}

function notHighlightable(node) {
  return isIgnoreNodeId(node) || isXrefContent(node) || isIgnoredNodeType(node)
}

function isIgnoreNodeId(node) {
  return ignoredNodeIds.indexOf(node.id) > -1
}

function isXrefContent(node) {
  return !!node.id && node.id.indexOf('Xref_content') > -1
}

function isIgnoredNodeType(node) {
  return ignoredNodeTypes.indexOf(node.nodeName) > -1
}

function isTextNode(node) {
  return node.nodeType === 3
}

function isElementNode(node) {
  return node.nodeType === 1
}

Taggifier.prototype._createWrappedAnnotatableText = function(text) {
  var opts = this._opts
    , idAttribute = opts.idPrefix ? (' id="' + opts.idPrefix + opts.counterSeparator + (this._counter++)) + '"' : ''
    , classAttribute = opts.className ? ' class="' + opts.className + '"' : ''

  return '<' + opts.tag + idAttribute + classAttribute + '>' + escape(text) + '</' + opts.tag + '>'
}

function escape(text) {
  switch(text) {
    case '&nbsp;':
      return text
    default:
      return _.escape(text)
  }
}

function createFragment(document, html) {
  var frag = document.createDocumentFragment()
    , temp = document.createElement('div')

  temp.innerHTML = html

  while (temp.firstChild) {
    frag.appendChild(temp.firstChild)
  }

  return frag
}