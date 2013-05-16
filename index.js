var Q = require('q')
  , _ = require('lodash')
  , jsdom = require('jsdom').jsdom
  , whiteSpaceRegex = /\s/
  , longWhiteSpaceRegex = /\s{2,1000}/g
  , ignoredNodeIds = ['inlinetermTerm', 'inlinedialog']
  , ignoredNodeTypes = ['SCRIPT', '#comment']

var Taggifier = module.exports = function(opts) {
  this.opts_ = _.extend({
    tag: 'span',
    className: 'highlightableElement',
    idPrefix: 'textHighlight',
    counterSeparator: '_',
    start: 0
  }, opts || {})
}

Taggifier.prototype.end = function() {
  this.opts_ = null
}

Taggifier.prototype.process = function(html) {
  var self = this

  self.counter_ = self.opts_.start

  return Q.ninvoke(jsdom, 'env', { html: html })
  .then(function(window) {
    var processHtml = surroundWithTags.call(self, window)
    window.close()

    return processHtml
  })
}

function surroundWithTags(window) {
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
      replacementText = surroundTextWithTags.call(this, currentNode.data)
      replacementNode = createFragment(document, replacementText)
      parentNode = currentNode.parentNode

      parentNode.replaceChild(replacementNode, currentNode)
    } else if (isElementNode(currentNode)) {
      _(currentNode.childNodes).toArray().reverse().each(function(childNode) {
        nodesToVisit.unshift(childNode)
      })
    }
  }

  return document.innerHTML
}

function surroundTextWithTags(text) {
  var self = this
    , allSpace = text.match(/^[\xA0\s]+$/g)
    , allWords, replacements, firstWordStartsWithSpace, lastWordEndsWithSpace

  if (allSpace) {
    return createWrappedAnnotatableText.call(self, text)
  }

  allWords = text.match(/\xA0\s*|[^ \xA0\t\r\n\v\f]+/g)
  firstWordStartsWithSpace = text.match(/^[\xA0\s]/)
  lastWordEndsWithSpace = text.match(/[\xA0\s]$/)

  return _(allWords).map(function(word, i) {
    var isFirst = i === 0
      , isLast = i === allWords.length - 1
      , nextWord = allWords[i + 1]
      , wordIsFollowedByNbsp = !isLast && nextWord.charAt(0) === '\xA0'

    return convert.call(self, word, isFirst, isLast, wordIsFollowedByNbsp, firstWordStartsWithSpace, lastWordEndsWithSpace)
  }).join('')
}

function convert(word, isFirst, isLast, wordIsFollowedByNbsp, firstWordStartsWithSpace, lastWordEndsWithSpace) {
  var wordIsNbsp = /^\xA0\s*$/.test(word)
    , replacements = []

  if (!wordIsNbsp && isFirst && firstWordStartsWithSpace) {
    replacements.push(createWrappedAnnotatableText.call(this, ' '))
  }

  replacements.push(createWrappedAnnotatableText.call(this, word))

  if (!wordIsNbsp && !wordIsFollowedByNbsp && (lastWordEndsWithSpace || !isLast)) {
    replacements.push(createWrappedAnnotatableText.call(this, ' '))
  }

  return replacements.join('')
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

function createWrappedAnnotatableText(text) {
  var opts = this.opts_
    , idAttribute = opts.idPrefix ? (' id="' + opts.idPrefix + opts.counterSeparator + (this.counter_++)) + '"' : ''
    , classAttribute = opts.className ? ' class="' + opts.className + '"' : ''

  return '<' + opts.tag + idAttribute + classAttribute + '>' + _.escape(text) + '</' + opts.tag + '>'
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
