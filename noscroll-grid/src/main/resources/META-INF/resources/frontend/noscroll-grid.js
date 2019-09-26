window.Vaadin.Flow.noscrollGridConnector = {
  initLazy: function(grid, pageSize) {
    if(grid.$noscrollConnector) {
      return;
    }
    grid.$noscrollConnector = {};

    grid.$connector.setVerticalScrollingEnabled(false);

    grid.pageSize = pageSize;

    grid.$noscrollConnector.showMoreSize = null;
    grid.$noscrollConnector.showMoreRows = 20;

    grid.$noscrollConnector.prevTouchScrollTop = 0;

    grid.$noscrollConnector.targetElement = null;
    grid.$noscrollConnector.targetScrollTopElement = null;

    grid.$noscrollConnector.initialHeight = grid.style.height;
    grid.style.minHeight = grid.$noscrollConnector.initialHeight;

    const regularScrollHandler = e => {
      if(grid.$noscrollConnector.targetElement.offsetHeight + grid.$noscrollConnector.targetElement.scrollTop >= grid.$noscrollConnector.targetElement.scrollHeight) {
        grid.showMore();
      }
    };
    const bodyScrollHandler = e => {
      if(grid.$noscrollConnector.targetElement.offsetHeight + grid.$noscrollConnector.targetScrollTopElement.scrollY >= grid.$noscrollConnector.targetElement.scrollHeight) {
        grid.showMore();
      }
    };
    const regularTouchMoveHandler = e => {
      grid.$noscrollConnector.targetScrollTopElement.removeEventListener("touchmove", regularTouchMoveHandler, false);
      grid.$noscrollConnector.targetScrollTopElement.removeEventListener("wheel", wheelHandler, false);
      grid.$.table.removeEventListener("wheel", wheelHandler, false);
      grid.$.table.addEventListener('wheel', grid.$.table.__wheelListener);
      grid.showMore();
    };
    const bodyTouchMoveHandler = e => {
      grid.$noscrollConnector.targetScrollTopElement.removeEventListener("touchmove", bodyTouchMoveHandler, false);
      grid.$noscrollConnector.targetScrollTopElement.removeEventListener("wheel", wheelHandler, false);
      grid.$.table.removeEventListener("wheel", wheelHandler, false);
      grid.$.table.addEventListener('wheel', grid.$.table.__wheelListener);
      grid.showMore();
    };
    const wheelHandler = e => {
      if(e.deltaY > 0) {
          grid.$noscrollConnector.targetScrollTopElement.removeEventListener("wheel", wheelHandler, false);
          grid.$noscrollConnector.targetScrollTopElement.removeEventListener("touchmove", regularTouchMoveHandler, false);
          grid.$noscrollConnector.targetScrollTopElement.removeEventListener("touchmove", bodyTouchMoveHandler, false);
          grid.$.table.removeEventListener("wheel", wheelHandler, false);
          grid.$.table.addEventListener('wheel', grid.$.table.__wheelListener); // add original wheel handler back
          grid.showMore();
      }
    };

    grid.setShowMoreSize = function(sizePx) {
      this.$noscrollConnector.showMoreSize = sizePx;
      grid.$noscrollConnector.showMoreRows = null;
    }

    grid.setShowMoreRows = function(rowCount) {
      grid.$noscrollConnector.showMoreRows = rowCount;
      this.$noscrollConnector.showMoreSize = null;
    }

    grid.setShowMoreOnScrollToBottom = function(target) {
      if(!target) {
        return;
      }
      grid.$noscrollConnector.targetElement = target;
      grid.$noscrollConnector.targetScrollTopElement = target;

      grid.$noscrollConnector.targetElement.removeEventListener("scroll", regularScrollHandler);
      grid.$noscrollConnector.targetElement.removeEventListener("touchmove", regularTouchMoveHandler);
      grid.$noscrollConnector.targetScrollTopElement.removeEventListener("scroll", bodyScrollHandler);
      grid.$noscrollConnector.targetElement.removeEventListener("touchmove", bodyTouchMoveHandler);
      grid.$noscrollConnector.targetScrollTopElement.removeEventListener("wheel", wheelHandler);
      grid.$.table.removeEventListener("wheel", wheelHandler);

      if(target === document.body) {
        grid.$noscrollConnector.targetScrollTopElement = window;
        grid.$noscrollConnector.targetScrollTopElement.addEventListener("scroll", bodyScrollHandler);
        grid.$noscrollConnector.targetElement.addEventListener("touchmove", bodyTouchMoveHandler);
      } else {
        grid.$noscrollConnector.targetElement.addEventListener("scroll", regularScrollHandler);
        grid.$noscrollConnector.targetElement.addEventListener("touchmove", regularTouchMoveHandler);
      }
      grid.$noscrollConnector.targetScrollTopElement.addEventListener("wheel", wheelHandler);
      grid.$.table.removeEventListener('wheel', grid.$.table.__wheelListener); // blocks wheel if not removed
      grid.$.table.addEventListener("wheel", wheelHandler);
    }

    /* 'showMore' adjusts grid height. Increases height by showMoreSize or showMoreRows when there are more items to show.
    *  Or decreases height remove all extra space below last row. */
    grid.showMore = function() {
      let newGridHeight = this.$.scroller.clientHeight + grid.$noscrollConnector.getShowMorePixelSize();
      this.style.height = newGridHeight + 'px';
      this.notifyResize();
      let contentHeight = this.$.items.clientHeight + this.$.header.clientHeight + this.$.footer.clientHeight;
      if(contentHeight < newGridHeight) {
        this.style.height = contentHeight + 'px';
        this.notifyResize();
      }
    }

    grid.resetHeight = function() {
      grid.style.height = grid.$noscrollConnector.initialHeight;
      grid.setShowMoreOnScrollToBottom(grid.$noscrollConnector.targetElement);
    }

    grid.$noscrollConnector.getShowMorePixelSize = function() {
      if(grid.$noscrollConnector.showMoreRows) {
        return grid.$noscrollConnector.showMoreRows * Math.ceil(grid._physicalSize / grid._physicalCount);
      } else {
        return grid.$noscrollConnector.showMoreSize;
      }
    }

    grid.$connector.fetchPageOriginal = grid.$connector.fetchPage;
    /* overriding gridConnector.js implementation to adjust buffer logic */
    grid.$connector.fetchPage = function(fetch, page, parentKey) {
      /* lets make sure that buffer is always same as given page size. Originally it would be number of visible rows.  */
      let start = grid._virtualStart;
      let physicalCount = grid._physicalCount;
      // grid._virtualEnd is read-only
      grid._physicalCount = grid.pageSize;
      grid._virtualStart = 0;

      grid.$connector.fetchPageOriginal(fetch, page, parentKey);
      // and revert back to original values
      grid._virtualStart = start;
      grid._physicalCount = physicalCount;
    }

  }
}
