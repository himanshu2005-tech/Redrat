import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, Dimensions, StyleSheet } from "react-native";
import firestore from "@react-native-firebase/firestore";
import Carousel from "react-native-reanimated-carousel";
import Video from "react-native-video";

const { width, height } = Dimensions.get("window");

const Motions = () => {
  const [motions, setMotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buffering, setBuffering] = useState(false); // To track video buffering state

  const fetchPosts = async () => {
    setLoading(true);

    try {
      const querySnapshot = await firestore()
        .collection("Posts")
        .where("hasVideo", "==", true)
        .where("isSensitive", "==", false)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      const fetchedMotions = [];
      querySnapshot.forEach((doc) => {
        fetchedMotions.push({ id: doc.id, ...doc.data() });
      });

      setMotions(fetchedMotions);
      console.log(fetchedMotions)
    } catch (error) {
      console.error("Error fetching motions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.motionContainer}>
      {buffering && (
        <ActivityIndicator
          size="small"
          color="#FF3131"
          style={styles.bufferingIndicator}
        />
      )}
      <Video
        source={{ uri: item.videoUrl }}
        style={styles.video}
        resizeMode="contain"
        paused={false}
        muted
        repeat
        onBuffer={() => setBuffering(true)} // Trigger buffering state
        onEnd={() => setBuffering(false)} // End of video, stop buffering
        onError={(error) => console.error("Video Error:", error)}
        onReadyForDisplay={() => setBuffering(false)} // Video ready to display, stop buffering
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FF3131" />
      ) : (
        <Carousel
          data={motions}
          renderItem={renderItem}
          width={width}
          height={height}
          vertical={false} // Horizontal carousel
          loop={true}
          autoplay={false}
          style={styles.carousel}
          // Add left stack effect
          itemWidth={width * 0.8} // Adjust this value for the desired stacking effect
          sliderWidth={width}
          inactiveSlideOpacity={0.7} // Dim inactive items
          inactiveSlideScale={0.8} // Scale down inactive items
        />
      )}
    </View>
  );
};

export default Motions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  motionContainer: {
    height: height,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10, 
  },
  video: {
    width: width,
    height: height,
  },
  carousel: {
    flex: 1,
  },
  bufferingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
});
