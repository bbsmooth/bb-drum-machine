/* Simple Menu */

import './SimpleMenu.css';
import Utils from './Utils';

class SimpleMenu {

    KEYCODE = Object.freeze({
        'TAB': 9,
        'RETURN': 13,
        'ESC': 27,
        'SPACE': 32,
        'PAGEUP': 33,
        'PAGEDOWN': 34,
        'END': 35,
        'HOME': 36,
        'LEFT': 37,
        'UP': 38,
        'RIGHT': 39,
        'DOWN': 40
    });

    name = null;
    menu = null;
    menubar = null;
    menubarChildren = null;
    expanded = false;
    activeMenubarIndex = null;
    events = null;

    constructor(menuName, menuTitle, menuConfig, menuEvents) {

        this.name = menuName;
        this.title = menuTitle; // used in aria-label
        this.events = menuEvents;
        this.menu = this._createMenu(menuConfig);
        this.menubar = this.menu.children[1];
        this.menubarChildren = [...this.menubar.children];
        this.hamburger = this.menu.children[0];

        //this.menu.addEventListener('focusout', this._handleFocusout.bind(this));
        this.menu.addEventListener('mouseover', this._handleMouseover.bind(this));
        this.menu.addEventListener('click', this._handleClick.bind(this));
        this.menu.addEventListener('keydown', this._handleKeydown.bind(this));
        document.body.addEventListener('mousedown', this._handleMousedown.bind(this));
    }

    getMenu() {
        return this.menu;
    }

    setFocusTo(id) {
        this._setFocus(id);
    }

    setFocusToFirstSubmenu() {
        if (this._isVertical()) {
            this._setVerticalMenu(false);
            this.hamburger.focus();
        }
        else {
            this._setFocusToMenubar(0);
        }
    }

    setFocusToActiveSubmenu() {
        this._setFocusToMenubar(this.activeMenubarIndex);
    }

    setFocusToHamburger() {
        this._setFocus(this.hamburger.id);
    }

    closeVerticalMenu() {
        if (this._isVertical() && this._isVerticalShowing()) {
            this._setVerticalMenu(false);
        }
    }

    closeActiveSubmenu() {
        this._closeActiveMenubar();
    }

    enableMenuItem(id) {
        document.getElementById(id).setAttribute('aria-disabled', 'false');
    }

    disableMenuItem(id) {
        document.getElementById(id).setAttribute('aria-disabled', 'true');
    }

    checkMenuItem(el) {
        this._checkMenuitemradio(el);
    }

    hideHamburger() {
        this.menu.classList.remove('show-menu');
        this._setHamburgerIcon(true);
    }

    // return true if any submenu is currently expanded
    isSubMenuExpanded() {
        let expanded = false;
        this.menubarChildren.forEach(child => {
            if (child.getAttribute('aria-expanded') === 'true') {
                expanded = true;
            }
        });
        return expanded;
    }

    isVertical() {
        return this._isVertical();
    }

    /*** PRIVATE ***/

    _setHamburgerIcon(show) {
        const icon = this.hamburger.childNodes[0];
        if (show) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times-circle');
        }
        else {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times-circle');
        }
    }

    _createMenu(menuConfig) {
        const name  = this.name;
        const menu = menuConfig;
        let menubar_count = 0;

        // create <nav>
        const nav = document.createElement('nav');
        nav.id = `menu-${name}`;
        nav.classList.add('boxMenu');
        nav.setAttribute('aria-label', `${this.title} menu`);
        if ('data' in menu && Array.isArray(menu.data)) {
            menu.data.forEach(dataObj => {
                Object.keys(dataObj).forEach(key => {
                    nav.setAttribute(`data-${key}`, dataObj[key]);
                });
            });
        }

        // create hamburger button
        const hamburger = document.createElement('button');
        hamburger.id = `menu-${name}-hamburger`;
        hamburger.classList.add('hamburger');
        hamburger.dataset.keyclick = false;
        hamburger.setAttribute('aria-label', 'Menu display');
        hamburger.setAttribute('aria-controls', `menu-${this.name}-ul`);
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-pressed', 'false');
        hamburger.innerHTML = '<i class="hamburger-icon fa fa-bars"></i>';
        nav.appendChild(hamburger);

        // create <ul> for menubar
        const menubar = document.createElement('ul');
        menubar.setAttribute('role', 'menubar');
        menubar.id = `menu-${name}-ul`;
        if ('data' in menu && Array.isArray(menu.data)) {
            menu.data.forEach(dataObj => {
                Object.keys(dataObj).forEach(key => {
                    menubar.setAttribute(`data-${key}`, dataObj[key]);
                });
            });
        }

        // create each menubar item
        if ('menubaritems' in menu && Array.isArray(menu.menubaritems)) {
            menu.menubaritems.forEach(menubarObj => {
                const menubar_item = document.createElement('li');
                if (menubar_count === 0) {
                    menubar_item.setAttribute('tabindex', '0');
                }
                else {
                    menubar_item.setAttribute('tabindex', '-1');
                }
                menubar_item.id = `menu-item-${name}_${menubar_count}`;
                menubar_item.setAttribute('role', 'menuitem');
                menubar_item.dataset.clickable = name;
                menubar_item.innerText = menubarObj.text;
                //menubar_item.innerHTML = `<span>${menubarObj.text}</span>`;
                if ('menuitems' in menubarObj && Array.isArray(menubarObj.menuitems)) {
                    menubar_item.setAttribute('aria-haspopup', 'true');
                    menubar_item.setAttribute('aria-expanded', 'false');
                }
                if ('data' in menubarObj && Array.isArray(menubarObj.data)) {
                    menu.data.forEach(dataObj => {
                        Object.keys(dataObj).forEach(key => {
                            menubar_item.setAttribute(`data-${key}`, dataObj[key]);
                        });
                    });
                }
                if ('menuitems' in menubarObj && Array.isArray(menubarObj.menuitems)) {
                    const menuitems = this._createMenuItems(menubarObj.menuitems, menubar_count);
                    menubar_item.appendChild(menuitems);
                }
                menubar.appendChild(menubar_item);
                menubar_count++;
            });
        }
        
        nav.appendChild(menubar);
        return nav;
    }

    // Is the menu in vertical orientation (i.e. is the hamburger showing)?
    _isVertical() {
        if (this.hamburger.clientHeight > 0) {
            return true;
        }
        return false;
    }

    _isAnyMenuitemExpanded() {
        let expanded = false;
        this.menubarChildren.forEach(child => {
            if (child.getAttribute('aria-expanded') === 'true') {
                expanded = true;
            } 
        });
        return expanded;
    }

    _isLastMenuItem(item) {
        // get the last index of the active menubar
        const menu_ul = document.getElementById(`menu-list-${this.name}_${this.activeMenubarIndex}`);
        const last_index = menu_ul.children.length - 1;
        // get the index of the item
        const itemIndex = this._getMenuitemIndexFromId(item.id);

        return itemIndex === last_index;
    }

    _isFirstMenuItem(item) {
        // get the index of the item
        const itemIndex = this._getMenuitemIndexFromId(item.id);

        return itemIndex === 0;
    }

    _createMenuItems(menuitemsObj, index) {
        if (!Array.isArray(menuitemsObj)) {
            return '';
        }
        const name = this.name;
        let item_count = 0;

        // create ul to hold the menu items
        const ul = document.createElement('ul');
        ul.setAttribute('role', 'menu');
        ul.setAttribute('aria-hidden', 'true');
        ul.id = `menu-list-${name}_${index}`;

        // add items to ul
        menuitemsObj.forEach(itemObj => {
            const item = document.createElement('li');
            item.setAttribute('tabindex', '-1');
            item.id = `menu-item-${name}_${index}_${item_count}`;
            if ('role' in itemObj) {
                item.setAttribute('role', itemObj.role);
            }
            else {
                item.setAttribute('role', 'menuitem');
            }
            item.dataset.clickable = name;
            if (Array.isArray(itemObj.text)) {
                if ('aria' in itemObj && itemObj.aria.checked === 'false') {
                    item.innerText = itemObj.text[1];
                    item.dataset.nexttext = itemObj.text[0];
                }
                else {
                    item.innerText = itemObj.text[0];
                    item.dataset.nexttext = itemObj.text[1];
                }
            }
            else {
                item.innerText = itemObj.text;
            }
            if ('toggle' in itemObj) {
                item.dataset.toggle = itemObj.toggle;
            }
            if ('toggleself' in itemObj) {
                item.dataset.toggleself = itemObj.toggleself;
            }
            if ('focusafterclick' in itemObj) {
                item.dataset.focusafterclick = itemObj.focusafterclick; 
            }
            if ('closeafterclick' in itemObj) {
                item.dataset.closeafterclick = itemObj.closeafterclick;
            }
            if ('data' in itemObj && Array.isArray(itemObj.data)) {
                itemObj.data.forEach(dataObj => {
                    Object.keys(dataObj).forEach(key => {
                        item.setAttribute(`data-${key}`, dataObj[key]);
                    });
                });
            }
            if ('aria' in itemObj && Array.isArray(itemObj.aria)) {
                itemObj.aria.forEach(ariaObj => {
                    Object.keys(ariaObj).forEach(key => {
                        item.setAttribute(`aria-${key}`, ariaObj[key]);
                    });
                });
            }
            ul.appendChild(item);
            item_count++;
        });

        return ul;
    }

    _isVerticalShowing() {
        if (this.menu.classList.contains('show-menu')) {
            return true;
        }
        return false;
    }

    // Change the vertical menu to open/closed state
    _setVerticalMenu(show) {
        if (show) {
            this._setHamburgerIcon(false);
            this.menu.classList.add('show-menu');
            this.menubarIndex = 0;
            this.hamburger.setAttribute('aria-expanded', 'true');
            //this.hamburger.setAttribute('aria-label', 'Close menu');
        }
        else {
            this._setHamburgerIcon(true);
            this.menu.classList.remove('show-menu');
            this.menubarIndex = null;
            this.hamburger.setAttribute('aria-expanded', 'false');
            //this.hamburger.setAttribute('aria-label', 'Show menu');
        }
    }

    _isElementInMenu(el) {
        return (this.menu.contains(el));
    }

    /* event handlers */

    _handleMousedown(event) {

        // if vertical menu is showing and the click was not on 
        // the menu
        if (this._isVerticalShowing()) {
            if (event.target.id === `menu-${this.name}` || !this._isElementInMenu(event.target)) {
                this._closeActiveMenubar(false);
                this.hideHamburger();
                this.menu.classList.remove('inFocus');
                this._setAriaPressed(false);
                this.hamburger.setAttribute('aria-expanded', 'false');
            }
        }
        else {
            if (!this._isElementInMenu(event.target) || event.target.id === `menu-${this.name}-ul`) {
                this._closeActiveMenubar(false);
                this.menu.classList.remove('inFocus');   
            }
        }
    }

    _setAriaPressed(state) {
        if (state === true || state === false) {
            this.hamburger.setAttribute('aria-pressed', state);
        }
        // otherwise, toggle current state
        else {
            const pressed = this.hamburger.getAttribute('aria-pressed') === 'true';
            this.hamburger.setAttribute('aria-pressed', !pressed); 
        }
    }

    // TODO: Clean up this method and possibly create some helper
    // methods for it.
    _handleClick(event) {
        // clicked on hamburger button
        if (event.target.id === `menu-${this.name}-hamburger` || event.target.classList.contains('hamburger-icon')) {
            if (this._isVerticalShowing()) {
                this._closeActiveMenubar(false);
                this._setVerticalMenu(false);
                this._setAriaPressed(false);
                this._removeInFocus();
            }
            else {
                this._setVerticalMenu(true);
                if (this.hamburger.dataset.keyclick === 'true') {
                    this._setFocusToMenubar(0);
                }
                this._setAriaPressed(true);
            }
            this.hamburger.dataset.keyclick = false;
            return;
        }

        const item = event.target;
        if (!item.dataset.clickable) {
            this._removeInFocus();
            return;
        }

        const itemType = this._getTargetType(item);
        // menubar clicks behave differently than menu item clicks
        if (itemType === 'menubarItem') {
            const itemIndex = this._getIndexFromId(item.id);
            
            // if the menubar item clicked on is already active
            if (itemIndex === this.activeMenubarIndex) {
                if (this.expanded) {
                    this._closeActiveMenubar();
                    this.expanded = false;
                }
                else {
                    this._expandMenubar(itemIndex);
                }
            }
            // otherwise we have clicked on a new menubar item
            else {
                // if there is a menubar already expanded, close it
                if (this.expanded) {
                    this._closeActiveMenubar();
                }
                // expand this new menubar
                this._expandMenubar(itemIndex);
            }
            this._setFocus(item.id);
        }
        else if (itemType === 'menuItem') {
            this._triggerMenuitem(item);
        }
    }

    _handleMouseover(event) {
        if (!event.target.dataset.clickable) {
            return;
        }

        const target = event.target;
        const target_type = this._getTargetType(target);

        if (target_type === 'menubarItem') {

            // If the menu is in vertical orientation then we don't 
            // want mouseover to work for the items in the menubar
            if (this._isVertical()) {
                if (this._isAnyMenuitemExpanded()) {
                    return;
                }
                else {
                    this._setFocusToMenubar(this._getMenubarIndexFromId(target.id));
                }
            }

            if (this._inFocus()) {
                //this.debug(`menubarItem and menu is inFocus: setting focus to ${target.id}`, null, debug_mark);
                this._setFocusToMenubar(this._getMenubarIndexFromId(target.id));
            }
            else if (this._menubarHasActiveElement()) {
                //this.debug(`menu not inFocus: setting focus to ${target.id}`, null, debug_mark);
                this._setFocus(target.id);
            }
        }
        else if (target_type === 'menuItem') {
            //this.debug(`menuItem: setting focus to ${target.id}`, null, debug_mark);
            this._setFocus(target.id);
        }
    }

    _handleKeydown(event) {
        if (event.repeat) {
            Utils.stopEvent(event);
            return;
        }

        const key = event.keyCode || event.which;

        if (event.altKey || event.ctrlKey || (event.shiftKey && key !== 9)) {
            return;
        }

        const item = event.target;
        const itemType = this._getTargetType(item);
        let action_taken = false;

        if (!this._isVertical() && this.activeMenubarIndex === null) {
            this.activeMenubarIndex = 0;
        }

        switch (key) {
            case this.KEYCODE.SPACE:
            case this.KEYCODE.RETURN:
            case this.KEYCODE.DOWN:
                if (event.target.classList.contains('hamburger')) {
                    this.hamburger.dataset.keyclick = true;
                }
                else if (itemType === 'menubarItem') {
                    this._setFocusToFirstMenuItem();
                    action_taken = true;
                }
                else if (itemType === 'menuItem') {
                    if (key === this.KEYCODE.DOWN) {
                        if (this._isVertical() && this._isLastMenuItem(item)) {
                            this._setFocusToNextMenubar(event);
                        }
                        else {
                            this._setFocusToNextMenuItem(this._getMenuitemIndexFromId(item.id));
                        }
                    }
                    else {
                        this._triggerMenuitem(item);
                    }
                    action_taken = true;
                }
                break;
            case this.KEYCODE.UP:
                if (itemType === 'menubarItem') {
                    this._setFocusToLastMenuItem();
                    action_taken = true;
                }
                else if (itemType === 'menuItem') {
                    if (this._isVertical() && this._isFirstMenuItem(item)) {
                        this._setFocusToPreviousMenubar(event);
                    }
                    else {
                        this._setFocusToPreviousMenuItem(this._getMenuitemIndexFromId(item.id));
                    }
                    action_taken = true;
                }
                break;            
            case this.KEYCODE.ESC:
                // never do anything when target is the 
                // hamburger button
                if (event.target.id === `menu-${this.name}-hamburger`) {
                    // do nothing
                }
                // if we are in the vertical menu and the target
                // is a top level menu item then close the menu
                // and put focus on hamburger
                else if (this._isVerticalShowing()) {
                    const parent = event.target.parentNode;
                    if (parent.getAttribute('role') === 'menubar') {
                        this._contractVerticalMenu();
                        this.hamburger.focus();
                    }
                    else {
                        this._closeActiveMenubar();
                    }
                    action_taken = true;
                }
                else {
                    this._closeActiveMenubar();
                    action_taken = true;
                }
                break;
            case this.KEYCODE.RIGHT:
                this._setFocusToNextMenubar(event);
                action_taken = true;
                break;
            case this.KEYCODE.LEFT:
                this._setFocusToPreviousMenubar(event)
                action_taken = true;
                break;
            case this.KEYCODE.HOME:
            case this.KEYCODE.PAGEUP:
                if (itemType === 'menubarItem') {
                    this._setFocusToMenubar(0);
                    action_taken = true;
                }
                else if (itemType === 'menuItem') {
                    this._setFocusToFirstMenuItem();
                    action_taken = true;
                }
                break;
            case this.KEYCODE.END:
            case this.KEYCODE.PAGEDOWN:
                if (itemType === 'menubarItem') {
                    this._setFocusToMenubar(this.menubarChildren.length-1);
                    action_taken = true;
                }
                else if (itemType === 'menuItem') {
                    this._setFocusToLastMenuItem();
                    action_taken = true;
                }
                break;
            case this.KEYCODE.TAB:
                if (this._isVertical()) {
                    // tab was pressed on hamburger button
                    if (event.target.id === `menu-${this.name}-hamburger`) {
                        // If the shift key is not down and the menu is expanded
                        // then put focus at first item (this should
                        // probably never happen).
                        if (!event.shiftKey && this._isVerticalShowing()) {
                            this._setFocusToMenubar(0);
                            Utils.stopEvent(event);
                        }
                        // otherwise, we just want to let tab take its
                        // natural course
                        return;
                    }
                    // tab pressed on any other menu item, so we want to 
                    // exit the menu and allow tab to move to next focus 
                    // point after menu
                    else {
                        this._contractVerticalMenu();
                        // if it was a shift+tab then put focus on hamburger
                        if (event.shiftKey) {
                            this.hamburger.focus();
                            Utils.stopEvent(event);
                        }
                        return;
                    }
                }
                else {
                    this._closeActiveMenubar();
                    this._setFocusToMenubar(this.activeMenubarIndex);
                    // We don't set action_taken here because we want
                    // the tab to bubble up and go forward/back to the
                    // next focusable element outside of the menu.
                }
                break;
            default:
                // allow user to choose item by first letter
        } // end switch

        if (action_taken) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    /* setters */

    _setFocus(id) {
        document.getElementById(id).focus();
        this._setInFocus();
    }

    _setFocusToMenuItem(itemId) {
        document.getElementById(itemId).focus(); 
    }

    _setFocusToFirstMenuItem() {
        this._expandMenubar(this.activeMenubarIndex);
        this._setFocusToMenuItem(this._getFirstMenuItemId(this.activeMenubarIndex));
    }

    _setFocusToLastMenuItem() {        
        // we need to get the last index of the active menubar
        const menu_ul = document.getElementById(`menu-list-${this.name}_${this.activeMenubarIndex}`);
        const last_index = menu_ul.children.length - 1;
        const last_id = `menu-item-${this.name}_${this.activeMenubarIndex}_${last_index}`;
        this._expandMenubar(this.activeMenubarIndex);
        this._setFocusToMenuItem(last_id);
    }

    _setFocusToNextMenuItem(currentMenuitemIndex) {
        // we need to get the last index of the active menubar
        const menu_ul = document.getElementById(`menu-list-${this.name}_${this.activeMenubarIndex}`);
        const last_index = menu_ul.children.length - 1;
        if (currentMenuitemIndex < last_index) {
            const next_id = `menu-item-${this.name}_${this.activeMenubarIndex}_${currentMenuitemIndex+1}`;
            this._setFocusToMenuItem(next_id);
        }
        else {
            this._setFocusToFirstMenuItem();
        }

    }

    _setFocusToPreviousMenuItem(currentMenuitemIndex) {       
        if (currentMenuitemIndex === 0) {
            this._setFocusToLastMenuItem();
        }
        else {
            const prev_id = `menu-item-${this.name}_${this.activeMenubarIndex}_${currentMenuitemIndex-1}`
            this._setFocusToMenuItem(prev_id);
        }
    }

    _setFocusToNextMenubar() {
        if (this.activeMenubarIndex >= this.menubarChildren.length-1) {
            this._setFocusToMenubar(0);
        }
        else {
            this._setFocusToMenubar(this.activeMenubarIndex+1);
        }
    }

    _setFocusToPreviousMenubar() {
        if (this.activeMenubarIndex === 0) {
            this._setFocusToMenubar(this.menubarChildren.length-1);
        }
        else {
            this._setFocusToMenubar(this.activeMenubarIndex-1);
        }
    }

    // Note: This does not set focus on menubar item
    _setActiveMenubar(menubarIndex) {
        // set all menubar items to tabindex = -1
        this.menubarChildren.forEach(child => child.setAttribute('tabindex', '-1'));
        // set this menubar item to tabindex = 0
        const realIndex = menubarIndex === null ? 0 : menubarIndex;
        this.menubarChildren[realIndex].setAttribute('tabindex', '0');
        this.activeMenubarIndex = realIndex;
    }

    _setFocusToMenubar(menubarIndex) {
        const menu_expanded = this.expanded;
        this._closeActiveMenubar();
        this._setActiveMenubar(menubarIndex);
        this._setFocus(this._getMenubarIdFromIndex(menubarIndex));
        if (menu_expanded) {
            this._expandMenubar(menubarIndex);
        }
        
    }

    /* getters */

    _getMenubarIdFromIndex(index) {
        return `menu-item-${this.name}_${index}`;
    }

    _getIndexFromId(id) {
        return Number(id.split('_').pop());
    }

    _getMenubarIndexFromId(id) {
        const idArray = id.split('_');
        return Number(idArray[1]);
    }

    _getFirstMenuItemId(menubarIndex) {
        return `menu-item-${this.name}_${menubarIndex}_0`;
    }

    _getMenuitemIndexFromId(id) {
        return Number(id.split('_')[2]);
    }

    // returns either "menubarItem" or "menuItem" (or undefined, though
    // this should not happen)
    _getTargetType(target) {
        // get parent of target
        const parent = target.parentNode;
        const parent_role = parent.getAttribute('role');
        if (parent_role === "menubar") {
            return "menubarItem";
        }
        else if (parent_role === "menu") {
            return "menuItem";
        }
    }

    _setInFocus() {
        this.menu.classList.add('inFocus');
    }

    _removeInFocus() {
        this.menu.classList.remove('inFocus');
    }

    _inFocus() {
        return this.menu.classList.contains('inFocus');
    }

    /* queries */

    _menubarHasActiveElement() {
        const activeElementId = document.activeElement.id
        for (let i=0; i<this.menubarChildren.length; i++) {
            if (this.menubarChildren[i].id === activeElementId) {
                return true;
            }
        }
        return false;
    }

    /* actions */

    _triggerMenuitem(menuItem) {
        const menubarIndex = this._getMenubarIndexFromId(menuItem.id);

        if (menuItem.getAttribute('aria-disabled') === 'true') {
            return;
        }

        // if the role of this menu item is 'menuitemradio' then we
        // need to set aria-checked to true for this item and false
        // for any other items with role='menuitemradio'
        const menuItemRole = menuItem.getAttribute('role');
        if (menuItemRole === 'menuitemradio') {
            const toggle = menuItem.getAttribute('data-toggle');
            const toggleSelf = menuItem.dataset.toggleself;
            if (toggle === 'true') {
                const newChecked = !(menuItem.getAttribute('aria-checked') === 'true');
                menuItem.setAttribute('aria-checked', newChecked);
                if (menuItem.dataset.nexttext !== undefined) {
                    const currText = menuItem.innerText;
                    menuItem.innerText = menuItem.dataset.nexttext;
                    menuItem.dataset.nexttext = currText;
                }
            }
            else if (toggleSelf === 'true') {
                const newChecked = !(menuItem.getAttribute('aria-checked') === 'true');
                menuItem.setAttribute('aria-checked', newChecked);
            }
            else {
                this._checkMenuitemradio(menuItem);
            }
        }
        
        this._fireCustomEvent(menuItem);

        const focusAfterClick = menuItem.getAttribute('data-focusafterclick') === "false" ? false : true;

        this._closeMenubar(menubarIndex, focusAfterClick);

        if (menuItem.getAttribute('data-closeafterclick') === 'true') {
            if (this._isVertical()) {
                this._contractVerticalMenu();
                this.hamburger.focus();
            }
        }
    }

    _expandMenubar(index) {
        // if a menubar is already expanded then close it
        if (this.expanded) {
            this.menubarChildren[this.activeMenubarIndex].setAttribute('aria-expanded', 'false');
            this.menubarChildren[this.activeMenubarIndex].children[0].setAttribute('aria-hidden', 'true');
        }
        // make this index the new active menubar
        this._setActiveMenubar(index);
        // and expand it
        this.menubarChildren[index].setAttribute('aria-expanded','true');
        this.menubarChildren[index].children[0].setAttribute('aria-hidden', 'false');
        this.expanded = true;
    }

    _checkMenuitemradio(el) {
        const toggleSelf = el.getAttribute('data-toggleself') === 'true';
        if (toggleSelf) {
            el.setAttribute('aria-checked', 'true');
            return;
        }

        const siblings = this._getAllSiblings(el);
        siblings.forEach(sib => {
            sib.setAttribute('aria-checked', 'false');
        });
        el.setAttribute('aria-checked', 'true');
    }

    _fireCustomEvent(el) {
        const custom_event = this._createCustomEvent(el);
        el.dispatchEvent(custom_event);
    }

    _createCustomEvent(el) {
        const el_id = el.id;
        const eventName = this.events[el_id] !== undefined ? this.events[el_id].name : el_id;
        return new CustomEvent(
            `${this.name}CustomEvent`, 
            {
                detail: {
                    menuItem: eventName
                },
                bubbles: true,
                cancelable: true,
            }
        );
    }

    _closeMenubar(index, setFocus=true) {

        if (index === null) {
            return;
        }

        this.menubarChildren[index].setAttribute('aria-expanded', 'false');
        this.menubarChildren[index].children[0].setAttribute('aria-hidden','true');
        if (setFocus === true) {
            this._setFocus(this._getMenubarIdFromIndex(index));
        }
        this.expanded = false;
    }

    _closeActiveMenubar(setFocus=true) {
        this._closeMenubar(this.activeMenubarIndex, setFocus);
    }

    _expandVerticalMenu() {

    }
    _contractVerticalMenu() {
        this._closeActiveMenubar(false);
        this._setVerticalMenu(false);
        this._removeInFocus();
        this._setAriaPressed(false);
    }

    /* utilities */

    _getAllSiblings(targetElem, filter) {
        const sibs = [];
        let nextElem = targetElem.parentNode.firstChild;
        do {
            // don't count text node
            if (nextElem.nodeType === 3) {
                nextElem = nextElem.nextSibling;
                continue;
            }
            // don't count the original target element
            if (nextElem === targetElem) {
                nextElem = nextElem.nextSibling;
                continue;
            }
            if (!filter || filter(nextElem)) sibs.push(nextElem);
            nextElem = nextElem.nextSibling;
        } while (nextElem !== null)
        return sibs;
    }

}

export default SimpleMenu;