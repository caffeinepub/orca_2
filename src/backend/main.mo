import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import authorization "./authorization/MixinAuthorization";
import AccessControl "./authorization/access-control";

actor {
  let accessControlState : AccessControl.AccessControlState = AccessControl.initState();
  include authorization(accessControlState);

  stable var userProfiles : Map.Map<Text, Text> = Map.empty();
  stable var appStateStore : Map.Map<Text, Text> = Map.empty();

  public shared ({ caller }) func saveCallerUserProfile(profileJson : Text) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Anonymous callers are not allowed");
    };
    let principalText = caller.toText();
    userProfiles.add(principalText, profileJson);
    #ok
  };

  public shared query ({ caller }) func getCallerUserProfile() : async { #ok : Text; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Anonymous callers are not allowed");
    };
    let principalText = caller.toText();
    switch (userProfiles.get(principalText)) {
      case (?profile) { #ok(profile) };
      case (null) { #err("Profile not found") };
    }
  };

  public shared query ({ caller }) func getAllUserProfiles() : async { #ok : [(Text, Text)]; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Anonymous callers are not allowed");
    };
    #ok(userProfiles.toArray())
  };

  public shared ({ caller }) func saveAppState(stateJson : Text) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Anonymous callers are not allowed");
    };
    let principalText = caller.toText();
    appStateStore.add(principalText, stateJson);
    #ok
  };

  public shared query ({ caller }) func loadAppState() : async { #ok : Text; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Anonymous callers are not allowed");
    };
    let principalText = caller.toText();
    switch (appStateStore.get(principalText)) {
      case (?state) { #ok(state) };
      case (null) { #err("App state not found") };
    }
  };
}
