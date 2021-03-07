const AppMenu = {
    menu: {
        menubaritems: [
            {
                text: 'File',
                menuitems: [
                    {
                        text: 'Save Session'
                    },
                    {
                        text: 'Load Session'
                    }
                ]
            },
            {
                text: 'Sounds',
                menuitems: [
                    {
                        text: 'Bank 1',
                        role: 'menuitemradio',
                        aria: [{ checked: true }],
                        data: [{ bank: 1 }]
                    },
                    {
                        text: 'Bank 2',
                        role: 'menuitemradio',
                        aria: [{ checked: false }],
                        data: [{ bank: 2 }]
                    }
                ]
            },
            {
                text: 'Options',
                menuitems: [
                    {
                        text: 'Auto-Play Keys',
                        role: 'menuitemradio',
                        toggleself: true,
                        aria: [{ checked: false }]
                    },
                    {
                        text: 'Alt Shortcuts',
                        role: 'menuitemradio',
                        toggleself: true,
                        aria: [{ checked: false }]
                    },
                    {
                        text: 'Metronome',
                        role: 'menuitemradio',
                        toggleself: true,
                        aria: [{ checked: false }]
                    },
                    {
                        text: 'Clear All Tracks',
                        role: 'menuitem',
                    }
                ]
            },
            {
                text: 'Help',
                menuitems: [
                    {
                        text: 'Instructions',
                        role: 'menuitem',
                        // when vertical menu is showing, 
                        // force menu to close after clicking
                        closeafterclick: true
                    },
                    {
                        text: 'About',
                        role: 'menuitem',
                        // tell SimpleMenu to not set focus
                        // to 'Help' after the user clicks on this
                        focusafterclick: false
                    },
                ]
            }
        ]
    },
    events: {
        'menu-item-appMenu_1_0': {
          name: 'bbdmSoundBank'
        },
        'menu-item-appMenu_1_1': {
          name: 'bbdmSoundBank'
        }
    }
};

export default AppMenu;