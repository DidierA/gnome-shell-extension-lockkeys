import Adw from 'gi://Adw';

export function createAlertDialog(parent, title, message) {
    const dialog=Adw.AlertDialog.new(title, message) ;
    dialog.add_response('ok', "OK");
    return dialog ;
}