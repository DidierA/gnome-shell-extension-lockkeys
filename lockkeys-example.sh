#!/bin/bash
# example script to be used with lockkeys gnome extension 
# change to suit your needs, and copy to ~/.config/lockkeys.sh

exec >>/tmp/lockkeys.txt

date

# CAPSLOCK and CAPSLOCK_PREV reveal if CAPSLOCK state has changed, they can contain the values 'On' or 'Off'
if [ "$CAPSLOCK_PREV" != "$CAPSLOCK" ] ; then
    echo "Caps Lock has been set to $CAPSLOCK"
    if [ "$CAPSLOCK" == "On" ]; then
        echo "Capslock is now on"
    else
        echo "Capslock is now off"
    fi
fi

# NUMLOCK and NUMLOCK_PREV reveal if NUMLOCK state has changed, they can contain the values 'On' or 'Off'
if [ "$NUMLOCK_PREV" != "$NUMLOCK" ] ; then 
    echo "Num Lock has been set to $NUMLOCK"
    if [ "$NUMLOCK" == "On" ]; then
        echo "Numlock is now on"
    else
        echo "Numlock is now off"
    fi
fi

# LOCKKEYS_NOTIFICATIONS reflects the Notification setting. It can be 'off', 'on' or 'osd'
echo "Notifications are  $LOCKKEYS_NOTIFICATIONS"

# LOCKKEYS_STYLE reflects the Indicator Style setting. It can be 'none', 'numlock', 'capslock', 'both', 'show-hide' or 'show-hide-capslock'.
echo "Style is $LOCKKEYS_STYLE"

echo ""
