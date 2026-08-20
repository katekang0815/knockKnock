const { withEntitlementsPlist } = require('@expo/config-plugins');

/**
 * KnockKnock uses only LOCAL notifications (the daily reminder), which do not
 * require the Push Notifications capability. expo-notifications adds the
 * `aps-environment` entitlement, which would force a push-enabled provisioning
 * profile (and an Apple Developer capability change). Strip it so the standard
 * App Store profile builds without push credentials.
 *
 * Remove this plugin if/when real remote push is added.
 */
module.exports = function withNoPush(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
