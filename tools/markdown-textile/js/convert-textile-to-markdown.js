(function () {
    let textileLib, TurndownServiceLib, turndownPluginGfmLib, normalizeTableHtmlLib, compensateRendererDiffsLib, formatFencedCodeLib;

    if (typeof module !== 'undefined' && module.exports) {
        const path = require('path');
        const vendorDir = path.join(__dirname, '..', 'vendor');

        const { JSDOM } = require('jsdom');
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
        global.DOMParser = dom.window.DOMParser;
        global.navigator = dom.window.navigator;

        textileLib = require(path.join(vendorDir, 'textile.js'));
        textileLib.setOptions({ breaks: false });
        TurndownServiceLib = require(path.join(vendorDir, 'turndown.min.js'));
        turndownPluginGfmLib = require(path.join(vendorDir, 'turndown-plugin-gfm.min.js'));
        const tableNormalize = require(path.join(__dirname, 'table-normalize.js'));
        normalizeTableHtmlLib = tableNormalize.normalizeTableHtml;
        const compensation = require(path.join(__dirname, 'textile-renderer-compensation.js'));
        compensateRendererDiffsLib = compensation.compensateRendererDiffs;
        const codeBlock = require(path.join(__dirname, 'code-block.js'));
        formatFencedCodeLib = codeBlock.formatFencedCode;
    } else {
        textileLib = window.textile;
        TurndownServiceLib = window.TurndownService;
        turndownPluginGfmLib = window.turndownPluginGfm;
        normalizeTableHtmlLib = window.normalizeTableHtml;
        compensateRendererDiffsLib = window.compensateRendererDiffs;
        formatFencedCodeLib = window.formatFencedCode;
    }

    textileLib.setOptions({ breaks: false });

    function createTurndownService() {
        const turndown = new TurndownServiceLib({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-'
        });
        turndown.use(turndownPluginGfmLib.gfm);
        turndown.addRule('fencedCodeBlock', {
            filter: function (node, options) {
                return options.codeBlockStyle === 'fenced' &&
                    node.nodeName === 'PRE' &&
                    node.firstChild &&
                    node.firstChild.nodeName === 'CODE';
            },
            replacement: function (content, node, options) {
                const codeEl = node.firstChild;
                const fenceBlock = formatFencedCodeLib(codeEl.getAttribute('class') || '', codeEl.textContent, options.fence);
                return '\n\n' + fenceBlock + '\n\n';
            }
        });
        return turndown;
    }

    function convertTextileToMarkdown(textileText) {
        const rawHtml = textileLib(textileText);
        const compensated = compensateRendererDiffsLib(rawHtml);
        const normalized = normalizeTableHtmlLib(compensated);
        const turndown = createTurndownService();
        return turndown.turndown(normalized);
    }

    if (typeof window !== 'undefined') {
        window.convertTextileToMarkdown = convertTextileToMarkdown;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { convertTextileToMarkdown };
    }
})();