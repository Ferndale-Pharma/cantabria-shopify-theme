"use strict";
/*! alphaListNav.js - v0.7.2
Build Date: 06-11-2022
Author: [Bryan Elliott] (https://github.com/elliottprogrammer/)
Git Repository: git+https://github.com/elliottprogrammer/alphaListNav.js.git */

/**
 * ** TODO: **
 * 2. Add options
 *    - Remember last letter cookie?
 *    - onLetterClick function()
 **/

class AlphaListNav {
  constructor(listElem, options = {}) {
    const defaultOptions = {
      initHidden: true,
      initHiddenText: "Tap a letter above to view matching items", // string or boolean false
      initLetter: "",
      includeAll: true,
      allText: "All",
      noMatchText: "No matching entries",
      includeNums: true,
      concatenateNums: true, // 0 - 9
      includeOther: false,
      flagDisabled: true,
      removeDisabled: false,
      prefixes: [], // array of strings and/or RegEx's
      filterSelector: "",
      showCounts: true,
      showLetterHeadings: true,
      letterHeadingTag: "h3",
    };

    this.listElem = this._isDomElement(listElem)
      ? listElem
      : document.getElementById(listElem);

    this.options = {
      ...defaultOptions,
      ...options,
    };

    this.alphaObj = null;
    this.alphaNav = null;
    this.newListHTML = null;

    // if there is options.prefixes[], check if any are strings, if so, convert to them to RegEx's
    if (this.options.prefixes.length) {
      const regexes = this.options.prefixes.map((val) => {
        if (typeof val === "string") {
          val = val.replace(/[.*+?^${}()|[\]\\]/, "\\$&");
          return val + "\\s";
        }
        if (typeof val === "object" && val instanceof RegExp) {
          return val.source + "\\s";
        }
      });
      this.options.prefixes = new RegExp(regexes.join("|"), "gi");
    }

    this.init();
  }

  init = () => {
    // if first arg is not an HTMLElement, return
    if (!this.listElem) {
      console.error(
        "The supplied argument must be a HTML DOM element or a valid element id (string)"
      );
      return;
    }
    // get array of list items
    const listItems = this._getListItems(this.listElem);
    //console.log(listItems);
    // sort list into an alphabetical object
    this.alphaObj = this._getAlphaObj(listItems);
    //console.log(this.alphaObj);
    // generate new list html with sorting markup
    this.newListHTML = this._generateNewListHTML(this.alphaObj);
    // generate the alpha-nav buttons html
    this.alphaNav = this._generateAlphaNav(this.alphaObj);
    // Replace the old list with the new alpha-list in the dom
    this.listElem.parentNode.replaceChild(this.newListHTML, this.listElem);
    // Add alpha-nav buttons to dom
    this.newListHTML.parentNode.insertBefore(this.alphaNav, this.newListHTML);

    this.initAlphaListNav(this.newListHTML, this.alphaNav, this.alphaObj);

    // Add event listener to alpha-nav buttons
    this.alphaNav.addEventListener("click", (e) => {
      // TODO: replace with create selectLetter() function
      e.preventDefault();
      if (!e.target.dataset.filter) return;
      const letter = e.target.dataset.filter;
      // remove active class from all buttons
      for (let btn of this.alphaNav.children) {
        btn.classList.remove("active");
      }
      // remove active class from all lists
      for (let ul of this.newListHTML.children) {
        ul.classList.remove("active");
      }
      // add active class to button clicked
      e.target.classList.add("active");
      // add active class to the list matching the cooresponding clicked letter
      if (letter === "*") {
        for (let div of this.newListHTML.children) {
          if (div.id !== "no-match") div.classList.add("active");
        }
      } else {
        this.newListHTML
          .querySelector(`#${letter.replace(/[-]/, "\\$&")}`)
          .classList.add("active");
      }
    });

    // Show letter counts
    if (this.options.showCounts) {
      Array.prototype.slice
        .call(this.alphaNav.children)
        .forEach((alphaLink) => {
          alphaLink.addEventListener("mouseover", (e) => {
            let count = 0;
            if (e.target.dataset.filter) {
              const filter = e.target.dataset.filter;
              if (filter !== "no-match") {
                if (filter === "*") {
                  count = Object.keys(this.alphaObj).reduce((accum, key) => {
                    return accum + this.alphaObj[key].length;
                  }, 0);
                } else {
                  count = this.alphaObj[filter].length;
                }
              }
            }
            const countElem = document.createElement("span");
            countElem.className = "alphaNav-count-elem";
            countElem.style.cssText = `position:absolute;left:0;width:100%;text-align:center;font-size:75%;`;
            countElem.textContent = count;
            // inject into dom, but with no visibility so we can calculate the element height
            countElem.style.visibility = "none";
            e.target.appendChild(countElem);
            const countElemHeight = countElem.getBoundingClientRect().height;
            // top position is -count elem height + 3.
            const countTopPos = countElemHeight + 2;
            // set count elem top position
            countElem.style.top = `-${countTopPos}px`;
            // and make visible
            countElem.style.visibility = "visible";
          });

          alphaLink.addEventListener("mouseout", (e) => {
            e.target.removeChild(e.target.children[0]);
          });
        });
    }
  };

  // Retrieve the text value from DOM node or an array of DOM nodes.
  // Taken from jQuery (source: https://github.com/jquery/jquery/blob/master/src/core.js)
  _getText = (elem) => {
    let node,
      ret = "",
      i = 0,
      nodeType = elem.nodeType;
    if (!nodeType) {
      // If no nodeType, this is expected to be an array
      while ((node = elem[i++])) {
        // Do not traverse comment nodes
        ret += this._getText(node);
      }
    } else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
      // Use textContent for elements
      if (typeof elem.textContent === "string") {
        return elem.textContent;
      } else {
        // Traverse its children
        for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
          ret += this._getText(elem);
        }
      }
    } else if (nodeType === 3 || nodeType === 4) {
      return elem.nodeValue;
    }
    return ret;
  };

  initAlphaListNav = (newListElem, alphaNavElem, alphaObj) => {
    // if initLetter is set, show that letter first
    if (this.options.initLetter) {
      // if init letter is All(*), show all
      if (this.options.initLetter === "*" && this.options.includeAll) {
        alphaNavElem
          .querySelector(
            `a[data-filter="${this.options.initLetter.toLowerCase()}"]`
          )
          .classList.add("active");
        const allListGroups = newListElem.querySelectorAll(
          "div.alpha-list-wrapper"
        );
        Array.prototype.slice
          .call(allListGroups)
          .forEach((div) => div.classList.add("active"));
        // else show init letter, if it exists..
      } else if (
        alphaObj.hasOwnProperty(this.options.initLetter.toLowerCase())
      ) {
        // TODO: replace with create selectLetter() function
        alphaNavElem
          .querySelector(
            `a[data-filter="${this.options.initLetter.toLowerCase()}"]`
          )
          .classList.add("active");
        newListElem
          .querySelector(`#${this.options.initLetter.toLowerCase()}`)
          .classList.add("active");
      }
    } else {
      // if initHidden set, don't show list
      if (this.options.initHidden) {
        if (this.options.initHiddenText)
          document.getElementById("initText").classList.add("active");
        // if includeAll is set, show all list
      } else if (this.options.includeAll) {
        const allListGroups = newListElem.querySelectorAll(
          "div.alpha-list-wrapper"
        );
        Array.prototype.slice
          .call(allListGroups)
          .forEach((div) => div.classList.add("active"));
        alphaNavElem
          .querySelector(`a[data-filter="*"]`)
          .classList.add("active");
        // if none of above, find first letter with with list items, and show that first.
      } else {
        const firstLetter = this._getArrayAtoZ()
          .find((char) => alphaObj.hasOwnProperty(char.toLowerCase()))
          .toLowerCase();

        // TODO: replace with/create selectLetter() function
        alphaNavElem
          .querySelector(`a[data-filter="${firstLetter}"]`)
          .classList.add("active");
        document.getElementById(firstLetter).classList.add("active");
      }
    }
  };

  _getListItems(listElem) {
    if (!listElem.children.length) return [];
    return Array.prototype.slice.call(listElem.children);
  }

  _isDomElement(elem) {
    return typeof HTMLElement === "object"
      ? elem instanceof HTMLElement //DOM2
      : elem &&
          typeof elem === "object" &&
          elem !== null &&
          elem.nodeType === 1 &&
          typeof elem.nodeName === "string";
  }

  // create object of list items ordered by each alphabet letter
  _getAlphaObj = (listItemsArray) => {
    const alphaList = listItemsArray.reduce((accum, val) => {
      let text = "";
      if (this.options.filterSelector) {
        const filterElem = val.querySelector(this.options.filterSelector);
        text = filterElem ? this._getText(filterElem) : this._getText(val);
      } else {
        text = this._getText(val);
      }
      if (text) {
        // if text first char is (-_*) for some reason, remove it because it will cause problems.
        text.trim().replace(/^[_*-]/, "");
        let letter;
        if (this.options.prefixes instanceof RegExp) {
          let result;
          if ((result = this.options.prefixes.exec(text)) !== null) {
            letter = text.charAt(this.options.prefixes.lastIndex).toLowerCase();
          } else {
            letter = text.charAt(0).toLowerCase();
          }
        } else {
          letter = text.charAt(0).toLowerCase();
        }
        if (letter.match(/[0-9A-Za-z]/)) {
          if (this.options.concatenateNums) {
            if (letter.match(/[0-9]/)) {
              letter = "_";
            }
          }
        } else {
          letter = "-";
        }

        if (accum[letter]) {
          accum[letter].push(val);
        } else {
          accum[letter] = [val];
        }
      }
      return accum;
    }, {});
    //if (this.options.initHidden) {
    //const initHiddenTextLi = document.createElement('li');
    //initHiddenTextLi.className = 'init-hidden-text';
    //initHiddenTextLi.textContent = this.options.initHiddenText;
    //alphaList['initText'] = [initHiddenTextLi];
    //}
    return alphaList;
  };

  _getHeading(key) {
    let headingText = "";
    switch (true) {
      case /^[*]$/.test(key):
        headingText = this.options.allText;
        break;
      case /^[_]$/.test(key):
        headingText = "0 - 9";
        break;
      case /^[-]$/.test(key):
        headingText = "Others";
        break;
      case /^initText$/.test(key):
        break;
      default:
        headingText = key.toUpperCase();
    }
    return headingText;
  }

  // generate new list HTML markup
  _generateNewListHTML = (alphaObj) => {
    const wrapper = document.createElement("div");
    wrapper.id = "alpha-list";
    wrapper.className = "alpha-list";
    const NewList = Object.keys(alphaObj)
      .sort((a, b) => {
        if (a === "-") return 1;
        if (b === "-") return -1;
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      })
      .map((key) => {
        const div = document.createElement("div");
        div.id = key;
        div.className = "alpha-list-wrapper";
        if (this.options.showLetterHeadings) {
          const allowedHeadingTags = [
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "p",
            "span",
            "div",
          ];
          // Sanitize headingTag
          const headingTag = allowedHeadingTags.includes(
            this.options.letterHeadingTag
          )
            ? this.options.letterHeadingTag
            : "h3";
          const heading = document.createElement(headingTag);
          heading.className = "alpha-list-heading";
          heading.id = this._getHeading(key).replace(/\s/g, "");
          heading.textContent = this._getHeading(key);
          if (heading.textContent) div.appendChild(heading);
        }
        const ul = document.createElement("ul");
        ul.className = "alpha-list-group";

        alphaObj[key].forEach((node) => {
          ul.appendChild(node.cloneNode(true));
        });
        div.appendChild(ul);
        wrapper.appendChild(div);
        return div;
      });
    const noMatchDiv = document.createElement("div");
    noMatchDiv.id = "no-match";
    const noMatchUl = document.createElement("ul");
    noMatchUl.className = "no-match-group";
    const noMatchLi = document.createElement("li");
    noMatchLi.textContent = this.options.noMatchText;

    noMatchUl.appendChild(noMatchLi);
    noMatchDiv.appendChild(noMatchUl);
    wrapper.appendChild(noMatchDiv);
    return wrapper;
  };

  // Generate alphabet navigation HTML markup
  _generateAlphaNav = (alphaObj) => {
    const alphaNav = document.createElement("div");
    alphaNav.id = "alpha-nav";
    alphaNav.className = "character-container";
    const abcChars = this._getArrayAtoZ();
    if (this.options.includeNums) {
      if (!this.options.concatenateNums) {
        this._getArray0to9()
          .reverse()
          .forEach((val) => abcChars.unshift(val.toString()));
      } else {
        abcChars.unshift("_");
      }
    }
    if (this.options.includeOther) abcChars.push("-");
    if (this.options.includeAll) abcChars.unshift("*");
    //console.log(abcChars);
    const navigationEntries = abcChars.reduce((block, navChar) => {
      if (alphaObj[navChar.toLowerCase()]) {
        if (navChar === "_") {
          return (
            block +
            '<a class="character-element" data-filter="' +
            navChar.toLowerCase() +
            '" href="#">0 - 9</a>'
          );
        } else if (navChar === "-") {
          return (
            block +
            '<a class="character-element" data-filter="' +
            navChar.toLowerCase() +
            '" href="#">...</a>'
          );
        } else {
          return (
            block +
            '<a class="character-element" data-filter="' +
            navChar.toLowerCase() +
            '" href="#">' +
            navChar +
            "</a>"
          );
        }
      } else if (navChar === "*") {
        return (
          block +
          '<a class="character-element" data-filter="' +
          navChar.toLowerCase() +
          '" href="#">' +
          this.options.allText +
          "</a>"
        );
      }
      if (this.options.flagDisabled) {
        if (this.options.removeDisabled) {
          return block;
        }
        if (navChar === "_") {
          return block + '<div class="character-element disabled">0 - 9</div>';
        } else if (navChar === "-") {
          return block + '<div class="character-element disabled">...</div>';
        } else {
          return (
            block +
            '<div class="character-element disabled">' +
            navChar +
            "</div>"
          );
        }
      }
      return (
        block +
        '<a class="character-element" data-filter="no-match" href="#">' +
        navChar +
        "</a>"
      );
    }, "");
    alphaNav.innerHTML = navigationEntries;
    return alphaNav;
  };

  // generate array of alphebet, a - z
  _getArrayAtoZ = () => {
    return Array.apply(null, { length: 26 }).map((x, i) =>
      String.fromCharCode(65 + i)
    );
  };

  _getArray0to9 = () => {
    return Array.apply(null, new Array(10)).map((x, i) => i);
  };
}
