import React from "react";
import {
  AsyncStorage,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Share,
  TextInput,
  SafeAreaView,
  FlatList,
} from "react-native";
import { SimpleLineIcons } from "@expo/vector-icons";
import { Button, Avatar, Icon } from "react-native-elements";
import moment from "moment";
import { format } from "date-fns";
import MapView, { Marker } from "react-native-maps";
import openMap, { createOpenLink } from "react-native-open-maps";
import { Permissions, Calendar, Localization, Alarm } from "expo";

export default class DetailEventScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const {handleShare } = navigation.state.params;
    
    return {
      title: "Details",
      headerTintColor: "#FFF",
      headerStyle: {
        backgroundColor: "#39CA74",
        borderBottomWidth: 0,
        headerTintColor: "#FFF",
      },
      headerRight: (
      <Icon
        name='share'
        type='material'
        color='#fff'
        iconStyle={{ marginRight: 15 }} 
        onPress={ () => handleShare()}
      />
      )
    };
  };

  constructor(props) {
    super(props);
    const event = props.navigation.state.params.item;
    this.state = {
      event: event || null,
      isLoading: false,
      commentsData: [],

      commentsText: '',
      isRSVP: false
    };
  }




  componentDidMount() {
    const { event } = this.state;
    this.props.navigation.setParams({ handleShare: this.onShare });

    this.setState({ isLoading: true });
    if (event === null) {
      Alert.alert(
        "Unable to display Post!",
        "Please try again later",
        [
          {
            text: "OK",
            onPress: () => {
              this.props.navigation.goBack();
            }
          }
        ],
        { cancelable: false }
      );
    } else {
      this.setState({ isLoading: false });
      console.log("HERE", event);
    }
    this.fetchComments();
  }

  async fetchComments() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      try {
        let response = await fetch(
          "http://ec2-54-183-219-162.us-west-1.compute.amazonaws.com:3000/messages/" + this.state.event.id,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Authorization: token
            },
          }
        );

        response.json().then(result => {
          this.setState({ commentsData: result.data })
        });
      } catch (error) {
        this.setState({ loading: false, response: error });
        console.log(error);
      }

    } catch (e) {
      console.log("AsyncStorage failed to retrieve token:", e);
    }
  }

  onShare = async ()  => {
    const { event } = this.state;
    
    const str =
      "Event name: " +
      event.Name +
      ". Time: " +
      format("January 01, 2019 " + event.StartTime, "hh:mm a") +
      ".";

    try {
      const result =  await Share.share({
        title: "Checkout this event from EventUp",
        message: str
      });
    } catch (error) {
      alert(error.message);
    }
  };

  async addRSVP() {
    const { event } = this.state;
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userId = await AsyncStorage.getItem('userId');

      try {
        let response = await fetch(
          "http://ec2-54-183-219-162.us-west-1.compute.amazonaws.com:3000/users/RSVP",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Authorization: token
            },

            body: JSON.stringify({
              UserId: userId,
              EventId: event.id
            })
          }
        );

        response.json().then(result => {
          console.log(result);

          if (result.status == true) {
            Alert.alert(
              "Alert!",
              "Successfully sent your RSVP sent to host",
              [
                {
                  text: "OK",
                  onPress: () => this.props.navigation.navigate("events")
                }
              ],
              { cancelable: false }
            );
          } else {
            Alert.alert("Alert!", "Failed to RSVP, Please try again later", [{ text: "OK" }], {
              cancelable: false
            });
          }
        });
      } catch (e) {
        console.log("Something failed with response", e);

        Alert.alert(
          "Alert!",
          "Error, Server Issue",
          [{ text: "OK" }],
          { cancelable: false }
        );
      }
    } catch (e) {
      console.log("AsynStorage failed", e);
    }
  }

  async removeRsvp() {
    const { event } = this.state;
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userId = await AsyncStorage.getItem('userId');

      try {
        let response = await fetch(
          "http://ec2-54-183-219-162.us-west-1.compute.amazonaws.com:3000/users/RSVP",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Authorization: token
            },

            body: JSON.stringify({
              UserId: userId,
              EventId: event.id
            })
          }
        );

        response.json().then(result => {
          console.log(result);

          if (result.status == true) {
            Alert.alert(
              "Alert!",
              "Successfully removed RSVP",
              [
                {
                  text: "OK",
                  onPress: () => this.props.navigation.navigate("events")
                }
              ],
              { cancelable: false }
            );
          } else {
            Alert.alert("Alert!", "Failed to delete RSVP, Please try again later", [{ text: "OK" }], {
              cancelable: false
            });
          }
        });
      } catch (e) {
        console.log("Something failed with response", e);

        Alert.alert(
          "Alert!",
          "Error, Server Issue",
          [{ text: "OK" }],
          { cancelable: false }
        );
      }
    } catch (e) {
      console.log("AsynStorage failed", e);
    }
  }

  async onRsvpButtonPress() {
    if(!this.state.isRSVP)
      this.addRSVP();
    else
      this.removeRsvp();
  }

  getRsvpButtonTitle = () => {
    if(!this.state.isRSVP)
    return "RSVP";
  else
    return "Remove RSVP";
  }

  getRsvpButtonStyle = () => {
    console.log("isRSVP: ", this.state.isRSVP);

    if(!this.state.isRSVP)
      return styles.rsvpAddButton;
    else
      return styles.rsvpRemoveButton;
  }

  loadingView = () => {
    return (
      <View style={styles.loadingView}>
        <ActivityIndicator size="large" />
      </View>
    );
  };

  onCommentButtonPress = async () => {
    const { event, commentsText } = this.state;
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      try {
        let response = await fetch(
          "http://ec2-54-183-219-162.us-west-1.compute.amazonaws.com:3000/messages/send",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Authorization: token
            },
            body:
            JSON.stringify({
              "SenderUserId": userId,
              "ReceiverEventId": event.id,
              "Message": commentsText
            })
          }
        );

        response.json().then(result => {
          console.log("Message Sent :", result);
          this.fetchComments();
          this.state.commentsText = "";

        });
      } catch (error) {
        this.setState({ loading: false, response: error });
        console.log(error);
      }

    } catch (e) {
      console.log("AsyncStorage failed to retrieve token:", e);
    }

  };

  onAddCalendarEvent = async item => {
    try {
      //Prompt the user to provide access to the calendar
      const { status } = await Permissions.askAsync(Permissions.CALENDAR);

      //If permission was granted, create the event
      if (status === "granted") {
        var dateString = item.StartDate.substring(0, 10);

        console.log(dateString + "T" + item.StartTime);
        console.log(dateString + "T" + item.EndTime);

        var eventID = await Calendar.createEventAsync(Calendar.DEFAULT, {
          title: item.Name,
          startDate: new Date(dateString + "T" + item.StartTime),
          endDate: new Date(dateString + "T" + item.EndTime),
          timeZone: Localization.timeZone,
          location: item.LocationName,
          alarms: [{ relativeOffset: -1440 }]
        })
          .then(event => {
            console.log("Created event");
            alert("Added Event to your Calendar");
          })
          .catch(error => {
            console.log("Problem creating event: ", error);
            alert("Event could not be created");
          });
      } else {
        //If the user denies permission to edit the calendar, notify the user that they can't create an event
        alert("You must provide access to your calendar to create an event");
        console.log("Permission to edit the calendar was denied");
      }
    } catch (error) {
      console.log(error);
    }
  };

  contentView = () => {
      const { isLoading, event, commentsText } = this.state;
  
      return (

        <View style={styles.mainContainer}>
          <ScrollView style={styles.scrollViewContainer}>
            <View style={styles.bannerImageContainer}>
              <Image
                // source={require("../img/sample_image.jpg")}
                source={{ uri: "http://" + event.Image }}
                style={{
                  flex: 1,
                  height: 200,
                  width: "100%"
                }}
                resizeMode="cover"
              />
            </View>
  
            <View style={styles.generalInformationContainer}>
              <Text style={styles.generalInformationHeaderTitleStyle}>
                {event.Name}
              </Text>
              <Text style={styles.byTextStyle}>{event.CategoryName}</Text>
  
              <TouchableOpacity
                style={styles.detailContainer}
                onPress={() => this.onAddCalendarEvent(event)}
                activeOpacity={0.8}
              >
                <SimpleLineIcons name="calendar" size={25} />
                <View style={styles.subDetailColumnContainer}>
                  <Text style={styles.detailMainText}>
                    {moment.utc(event.StartDate).format("MMMM DD")}
                  </Text>
                  <Text style={styles.detailSubText}>
                    {format("January 01, 2019 " + event.StartTime, "hh:mm a")}
                  </Text>
                </View>
              </TouchableOpacity>
                <View style={styles.detailContainer}>
                  <SimpleLineIcons name="tag" size={25} />
                  <View style={styles.subDetailColumnContainer}>
                    <Text style={styles.detailMainText}>Free</Text>
                    <Text style={styles.detailSubText}>on EventUp</Text>
                  </View>
                </View>
              </View>
            {/* generalInformationContainer End */}
  
            <View style={styles.aboutEventContainer}>
              <Text style={styles.aboutTitleStyle}>About</Text>
              <Text
                style={styles.descriptionStyle}
                numberOfLines={4}
                ellipsizeMode="tail"
              >
                {event.Description}
              </Text>
            </View>
            {/* aboutEventContainer End */}
  
            <View style={styles.locationContainer}>
              <Text style={styles.locationTitleStyle}>Location</Text>
              <Text style={styles.locationSubTitleStyle}>
                {event.LocationName}
              </Text>
              <View style={styles.mapImageContainer}>
  
                <MapView
                style={{flex: 1}}
                region={{
                  latitude: event.Latitude,
                  longitude: event.Longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421
                }}
                showsUserLocation={true}
                >
              <MapView.Marker
                  coordinate= {
                    {latitude: event.Latitude,
                    longitude: event.Longitude}
                  }
                  onPress= { createOpenLink({end: `${event.Latitude} ${event.Longitude}` }) }
              />
              </MapView>
              </View>
            </View>
            {/* locationContainer End */}
  
            {/* Comments Section Start */}
  
            <View style={styles.commentsInput}>
              <TextInput
                placeholder="Leave a comment..."
                style={{ paddingLeft: 5, paddingRight: 5, height: 80, borderColor: 'gray', borderWidth: 1 }}
                onChangeText={(text) => this.setState({ commentsText: text })}
                value={commentsText}
                editable={true}
                multiline={true}
                numberOfLines={4}
              />
            </View>
            <Button
              title="Comment"
              type="outline"
              titleStyle={{ fontSize: 12, color: "white" }}
              containerStyle={{
                marginTop: 20,
                marginBottom: 40,
                marginLeft: 20,
                alignSelf: "center"
              }}
              buttonStyle={styles.commentButton}
              onPress={() => this.onCommentButtonPress()}
            />
            <Text style={styles.baseText}>
              Comments
            </Text>
  
            <FlatList
              data={this.state.commentsData}
              style={styles.commentsList}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    marginBottom: 25,
                  }}>
                  <View
                    style={styles.avatarView}>
                    <Avatar
                      size="small"
                      rounded
                      title={item.FirstName.substring(0, 1) + item.LastName.substring(0, 1)}
                    />
                  </View>
                  <View style={{}}>
                    <View style={{ flexDirection: "row", paddingBottom: 5 }}>
                      <Text style={styles.commentName}> {item.FirstName}{" "}{item.LastName}</Text>
                      <Text style={styles.commentTimestamp}>  {moment.utc(item.Timestamp).format("MMMM DD")} {" | "} {format(item.Timestamp, "hh:mm a")} </Text>
                    </View>
  
                    <Text numberOfLines={5} style={{
                      flex: 1, width: 300,
                    }}>{" "}{item.Message}</Text>
  
                  </View>
                </View>
              )}
            />
          
          </ScrollView>
          {/* Comments Section End */}
          <View style={styles.purchaseContainer}>
            <TouchableOpacity>
              <Button
                onPress={() => this.onRsvpButtonPress()}

                title = {this.getRsvpButtonTitle()}
                buttonStyle = {this.getRsvpButtonStyle()}

                titleStyle={{ fontSize: 25, fontFamily: "Futura" }}
                rounded
              />
            </TouchableOpacity>
          </View>
        </View>
      );
  }

  render() {
    const { isLoading } = this.state;
    return (
      <View style={styles.mainContainer}>
        {isLoading ? this.loadingView() : this.contentView()}
      </View>
    );
  }
}

const styles = StyleSheet.create({

  mainContainer: {
    flex: 1
  },

  scrollViewContainer: {
    flexGrow: 1
  },

  bannerImageContainer: {
    flex: 1,
    width: "100%",
    height: 200
  },
  // banner end

  generalInformationContainer: {
    flex: 2,
    width: "100%",
    height: 375
  },
  generalInformationHeaderTitleStyle: {
    fontSize: 25,
    textAlign: "left",
    marginTop: 30,
    marginLeft: 15
  },
  byTextStyle: {
    fontSize: 15,
    textAlign: "left",
    marginTop: 10,
    marginLeft: 15
  },
  detailContainer: {
    flexDirection: "row",
    marginLeft: 30,
    marginRight: 30,
    marginTop: 30
  },
  subDetailColumnContainer: {
    marginLeft: 20
  },
  detailMainText: {
    marginBottom: 5
  },
  detailSubText: {
    color: "gray"
  },
  // general information end

  aboutEventContainer: {
    flex: 1,
    justifyContent: "flex-start",
    width: "100%",
    height: 200
  },
  aboutTitleStyle: {
    fontSize: 15,
    marginTop: 30,
    marginBottom: 10,
    marginLeft: 15,
    marginRight: 15
  },
  descriptionStyle: {
    marginTop: 10,
    marginLeft: 15,
    marginRight: 15
  },
  // about event end

  locationContainer: {
    flex: 2,
    width: "100%",
    height: 400
  },
  locationTitleStyle: {
    fontSize: 15,
    marginTop: 30,
    marginBottom: 10,
    marginLeft: 15,
    marginRight: 15
  },
  locationSubTitleStyle: {
    fontSize: 15,
    marginTop: 30,
    marginBottom: 10,
    marginLeft: 15,
    marginRight: 15,
    fontWeight: "bold"
  },
  mapImageContainer: {
    padding: 10,
    width: "100%",
    height: 200
  },
  // location information end

  purchaseContainer: {
    width: "100%",
    height: 60,
    alignItems: "center",
    marginBottom: 5
  },

  rsvpAddButton: {
    width: 375,
    height: 70,
    backgroundColor: "#39CA74"
  },

  rsvpRemoveButton: {
    width: 375,
    height: 70,
    backgroundColor: "#FF0000"
  },

  commentButton: {
    width: 80,
    height: 40,
    borderRadius: 5,
    backgroundColor: "#39CA74"
  },

  commentsInput: {
    paddingLeft: 10,
    paddingRight: 10
  },

  commentsList: {
    paddingLeft: 20,
    paddingRight: 20
  },

  commentName: {
    fontWeight: "500",
    paddingRight: 10,
    fontSize: 12.5

  },

  commentTimestamp: {
    color: "grey",
    fontSize: 12
  },
  baseText: {
    fontSize: 32,
    marginLeft: 10,
    fontWeight: 'bold',
    paddingBottom: 20
  },

  avatarView: {
    paddingRight: 10,   
  }
});
