import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import * as Config from 'resource:///org/gnome/Shell/Extensions/js/misc/config.js';
import * as Const from './const.js' ;
import * as Utils from './Util.js' ;

const STYLE = 'style';
const STYLE_NONE = 'none';
const STYLE_NUMLOCK_ONLY = 'numlock';
const STYLE_CAPSLOCK_ONLY = 'capslock';
const STYLE_BOTH = 'both';
const STYLE_SHOWHIDE = 'show-hide';
const STYLE_SHOWHIDE_CAPSLOCK = 'show-hide-capslock';
const NOTIFICATIONS = 'notification-preferences';
const NOTIFICATIONS_OFF = 'off';
const NOTIFICATIONS_ON = 'on';
const NOTIFICATIONS_OSD = 'osd';

export default class LockKeysPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) { // window is an ExtensionPrefsDialog
        //console.log(window) ;
        const group = new Adw.PreferencesGroup({
            title: _('Settings'),
            description: _('Change indicator display options')
        });
        group.add(this.buildPrefsWidget());
        const page = new Adw.PreferencesPage();
        page.add(group);
        window.add(page);

        // window.connect('close-attempt', function(widget) {
        //     console.log('closed');
        // });
    }

    buildPrefsWidget() {
    	const indicator_style = this.createComboBox(
    	    STYLE,
    	    _("Indicator Style"),
    	    _("Change indicator display options"),
    	    {
                [STYLE_NONE]: _("Notifications Only"),
                [STYLE_NUMLOCK_ONLY]: _("Num-Lock Only"),
                [STYLE_CAPSLOCK_ONLY]: _("Caps-Lock Only"),
                [STYLE_BOTH]: _("Both"),
                [STYLE_SHOWHIDE]: _("Show/Hide"),
                [STYLE_SHOWHIDE_CAPSLOCK]: _("Show/Hide Caps-Lock Only")
    	    }
    	);

    	const notifications_style = this.createComboBox(
    	    NOTIFICATIONS,
    	    _("Notifications"),
    	    _("Show notifications when state changes"),
    	    {
                [NOTIFICATIONS_OFF]: _("Off"),
                [NOTIFICATIONS_ON]: _("Compact"),
                [NOTIFICATIONS_OSD]: _("Osd")
    	    }
    	);

        // checkbox : enable script
        const enable_script = this.createSwitchRow(
            Const.ENABLE_SCRIPT,
            _('Enable script'),
            _('If active, the script will be launched on each change of caps-lock or num-lock')
        );

        // File chooser  Gtk.FileDialog() ?
        const script_path = this.createEntryRow(
            Const.SCRIPT_PATH,
            _('Script path'),
            _('Path to the script to launch on each change of caps-lock or num-lock')
        );
        
        return this.createVerticalBoxCompat(indicator_style, notifications_style, enable_script, script_path);
    }

    // Really, really ugly code here, to get access to the reference to the instance in a callback.
    // This is nonsense. I sincerely hope that I suck at JS, Gtk, and so on, and a better solution exists.
    fileEntryIconCallbackGen(this_ref,key) {
        return function (entry, icon_pos) { return this_ref.fileEntryIconCallback(this_ref, key, entry, icon_pos); };
    }

    // called when the icon of the file entry is clicked.
    fileEntryIconCallback(this_ref, key, entry, icon_pos) {
        // only act on secondary icon press.
        if (icon_pos == Gtk.EntryIconPosition.PRIMARY)
             return ;

        const file_dialog = new Gtk.FileDialog() ;
        file_dialog.set_initial_file(Gio.File.new_for_path(entry.get_text()));
        file_dialog.open(entry.get_ancestor(Gtk.Window), new Gio.Cancellable() , function(filedialog, result) {
            let file ;
            try {
                file=filedialog.open_finish(result) ;
            } catch (error) {
                // silence 'Dismissed by User' exception.
                if ( error instanceof Gtk.DialogError && error.message == "Dismissed by user") {
                    return ;
                }
                throw(error) ;
            }

            // hopefully a file has been choosen
            // check that it is executable
            const file_info=file.query_info("*",Gio.FileQueryInfoFlags.NONE,null);
            if (! file_info.get_attribute_boolean("access::can-execute")) {
                const ine_dialog = Utils.createAlertDialog(
                    entry,
                    _('File is not executable!'),
                    'File' + file.get_path() + ' is not executable',
                );
                ine_dialog.present(entry);
                // the dialog has already been closed, what can we do?
                return ;
            }

            // change entry to match
            entry.set_text(file.get_path());
            this_ref.getSettings().set_string(key, entry.get_text());
        }) ;
    }

    createEntryRow(key, text, tooltip) {

        let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text:tooltip });
        const _settings = this.getSettings();
        const prev_value = _settings.get_string(key);

        let widget = new Gtk.Entry() ;
        widget.set_text(prev_value);
        widget.halign = Gtk.Align.FILL;

        // set secondary icon to launch file chooser
        let icon = Gio.ThemedIcon.new_with_default_fallbacks('document-open-symbolic');
        widget.set_icon_from_gicon(Gtk.EntryIconPosition.SECONDARY, icon) ;
        widget.connect('icon-press', this.fileEntryIconCallbackGen(this,key)) ;
        
        // called when enter key is pressed
        // TODO: better handling, check if it has changed when window is closed
        widget.connect('activate', function(entry_widget) {
            const prev_value = _settings.get_string(key);
            
            let path=widget.get_text() ;
            
            // Check that the entry is a valid file
            let file=Gio.File.new_for_path(path) ;
            // console.log('Path: ' + file.get_path()) ;
            if (! file.query_exists(null)) {
                const dne_dialog = Utils.createAlertDialog(
                    entry_widget,
                    _('File does not exist!'),
                    'File' + file.get_path() + ' does not exist',
                );
                dne_dialog.present(entry_widget);
                entry_widget.set_text(prev_value) ;
                return ;
            }

            const file_info=file.query_info("*",Gio.FileQueryInfoFlags.NONE,null);
            
            //for ( const attr of file_info.list_attributes(null)) {
            //    console.log(attr + ':' + file_info.get_attribute_as_string(attr)) ;
            //}

            // Check if file is executable
            if (! file_info.get_attribute_boolean("access::can-execute")) {
                const ine_dialog = Utils.createAlertDialog(
                    entry_widget,
                    _('File is not executable!'),
                    'File' + file.get_path() + ' is not executable',
                );
                ine_dialog.present(entry_widget);
                entry_widget.set_text(prev_value) ;
                return ;
            }
            
            let icon=file_info.get_icon() ; // returns Gio.icon
            entry_widget.set_icon_from_gicon(Gtk.EntryIconPosition.PRIMARY, icon) ;
            //entry_widget.set_icon_sensitive(Gtk.EntryIconPosition.PRIMARY);
            
            _settings.set_string(key,widget.get_text()) ;
        });

        return this.createHorizontalBoxCompat(label, widget);
    }

    createSwitchRow(key, text, tooltip) {
        let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text:tooltip });
        const _settings = this.getSettings();

        let widget = new Gtk.Switch({active: _settings.get_boolean(key)});
        widget.connect('notify::active', function(switch_widget) {
            _settings.set_boolean(key, widget.active);
        });
        widget.halign = Gtk.Align.END;

        return this.createHorizontalBoxCompat(label, widget);
    }

    createComboBox(key, text, tooltip, values) {
    	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text:tooltip });
    	let widget = new Gtk.ComboBoxText();
    	widget.halign = Gtk.Align.END;
    	for (let id in values) {
    		widget.append(id, values[id]);
    	}

    	const _settings = this.getSettings();
    	widget.set_active_id(_settings.get_string(key));
    	widget.connect('changed', function(combo_widget) {
    		_settings.set_string(key, combo_widget.get_active_id());
    	});

    	return this.createHorizontalBoxCompat(label, widget);
    }

    createVerticalBoxCompat(...widgets) {
        const box = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 10,
            margin_top: 20,
            margin_bottom: 20,
            margin_start: 20,
            margin_end: 20
        });
        widgets.forEach(widget => box.append(widget));
        box.show();
        return box;
    }

    createHorizontalBoxCompat(label, widget) {
        const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, homogeneous: true});
        box.append(label);
        box.append(widget);
        return box;
    }
}
