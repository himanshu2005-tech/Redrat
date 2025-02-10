import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import {BarChart, LineChart} from 'react-native-chart-kit';
import moment from 'moment';
import auth from '@react-native-firebase/auth';
import color from './color';
import {Switch} from './Switch';
import {SharedElement} from 'react-navigation-shared-element';

const screenWidth = Dimensions.get('window').width;

const styles = {
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  header: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubTitle: {
    color: '#888',
    fontSize: 14,
  },
  chartContainer: {
    paddingVertical: 20,
  },
  chartTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 10,
  },
  loadingText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalValue: {
    fontSize: 16,
    color: '#ccc',
    fontWeight: 'bold',
    marginTop: 10,
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: color,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
};

export default function PostAnalytics({route, navigation}) {
  const {post_id} = route.params;
  const [visitDataPoints, setVisitDataPoints] = useState([]);
  const [saveDataPoints, setSaveDataPoints] = useState([]);
  const [likeDataPoints, setLikeDataPoints] = useState([]);
  const [labels, setLabels] = useState([]);
  const [tooltipData, setTooltipData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bezier, setBezier] = useState(false);
  const [showDataPoints, setShowDataPoints] = useState(false);
  const [showValues, setShowValues] = useState(false);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(today.getDate() - 14);
        twoWeeksAgo.setHours(0, 0, 0, 0);
  
        const visitSnapshot = await firestore()
          .collection('Posts')
          .doc(post_id)
          .collection('Views')
          .where('seenAt', '>=', firestore.Timestamp.fromDate(twoWeeksAgo))
          .where('seenAt', '<=', firestore.Timestamp.fromDate(today))
          .get();
  
        const visitData = {};
        visitSnapshot.forEach((doc) => {
          const visitDate = doc.data().seenAt.toDate();
          const dateKey = visitDate.toISOString().split('T')[0];
          visitData[dateKey] = (visitData[dateKey] || 0) + 1;
        });
  
        const savedSnapshot = await firestore()
          .collection('Posts')
          .doc(post_id)
          .collection('Saves')
          .where('savedAt', '>=', firestore.Timestamp.fromDate(twoWeeksAgo))
          .where('savedAt', '<=', firestore.Timestamp.fromDate(today))
          .get();
  
        const saveData = {};
        savedSnapshot.forEach((doc) => {
          const saveDate = doc.data().savedAt.toDate();
          const dateKey = saveDate.toISOString().split('T')[0];
          saveData[dateKey] = (saveData[dateKey] || 0) + 1;
        });
  
        const likedSnapshot = await firestore()
          .collection('Posts')
          .doc(post_id)
          .collection('Likes')
          .where('likedAt', '>=', firestore.Timestamp.fromDate(twoWeeksAgo))
          .where('likedAt', '<=', firestore.Timestamp.fromDate(today))
          .get();
  
        const likeData = {};
        likedSnapshot.forEach((doc) => {
          const likedDate = doc.data().likedAt.toDate();
          const dateKey = likedDate.toISOString().split('T')[0];
          likeData[dateKey] = (likeData[dateKey] || 0) + 1;
        });
  
        const visits = [];
        const saves = [];
        const likes = [];
        const days = [];
        for (let i = 0; i < 16; i++) {
          const date = new Date(twoWeeksAgo);
          date.setDate(date.getDate() + i);
          const dateKey = date.toISOString().split('T')[0];
          days.push(moment(dateKey).format('MMM DD'));
          visits.push(visitData[dateKey] || 0);
          saves.push(saveData[dateKey] || 0);
          likes.push(likeData[dateKey] || 0);
        }
  
        setLabels(days);
        setVisitDataPoints(visits);
        setSaveDataPoints(saves);
        setLikeDataPoints(likes);
        console.log(likes)
        console.log(saves)
        console.log(visits)
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAnalyticsData();
  }, [post_id]);
  

  const completeSum = arr => {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return sum;
  };
  const chartColors = {
    visits: '#ff3131', // Color for Visits
    posts: '#31aaff', // Color for Posts
    members: '#31ffa3', // Color for Members
  };

  const renderCombinedChart = () => {

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Overall Post Analytics</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={{
              labels: labels,
              datasets: [
                {
                  data: visitDataPoints,
                  color: () => chartColors.visits,
                  strokeWidth: 2,
                  legend: 'Visits',
                },
                {
                  data: likeDataPoints,
                  color: () => chartColors.posts,
                  strokeWidth: 2,
                  legend: 'Likes',
                },
                {
                  data: saveDataPoints,
                  color: () => chartColors.members,
                  strokeWidth: 2,
                  legend: 'Saves',
                },
              ],
              legend: ['Visits', 'Likes', 'Saves'],
            }}
            width={labels.length * 50}
            height={300}
            withDots={showDataPoints}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            bezier={bezier}
            chartConfig={{
              backgroundGradientFrom: 'black',
              backgroundGradientTo: 'black',
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {borderRadius: 8},
              propsForDots: {
                r: '4',
                strokeWidth: '2',
              },
            }}
            onDataPointClick={e => {
              const index = e.index;
              const dateLabel = labels[index];
              const value = e.value;
              const datasetIndex = e.datasetIndex;

              const datasetNames = ['Visits', 'Likes', 'Saves'];
              setTooltipData({
                dateLabel,
                value,
                legend: datasetNames[datasetIndex],
              });
              setModalVisible(true);
            }}
          />
        </ScrollView>
      </View>
    );
  };

  const renderBarGraph = () => {
    const data = {
      labels: ['Visits', 'Likes', 'Saves'],
      datasets: [
        {
          data: [visitDataPoints[15], likeDataPoints[15], saveDataPoints[15]],
          colors: [
            () => chartColors.visits,
            () => chartColors.posts,
            () => chartColors.members,
          ],
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Post Analytics (Today)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={data}
            width={screenWidth}
            height={300}
            withVerticalLines={false}
            fromZero
            showBarTops={showValues}
            showValuesOnTopOfBars={showValues}
            withInnerLines={false}
            chartConfig={{
              backgroundGradientFrom: 'black',
              backgroundGradientTo: 'black',
              color: (opacity = 1) => 'white',
              labelColor: (opacity = 1) => 'white',
              style: {borderRadius: 8},
              propsForDots: {
                r: '4',
                strokeWidth: '2',
              },
            }}
            onDataPointClick={e => {
              const index = e.index;
              const dateLabel = labels[index];
              const value = e.value;
              const datasetIndex = e.datasetIndex;

              const datasetNames = ['Visits', 'Posts', 'Members'];
              setTooltipData({
                dateLabel,
                value,
                legend: datasetNames[datasetIndex],
              });
              setModalVisible(true);
            }}
          />
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon
          size={30}
          color={color}
          name="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <View>
          <Text style={styles.headerTitle}>Post Analytics Data</Text>
          <Text style={styles.headerSubTitle}>
            View the analytics from previous recordings
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={color} style={{marginTop: 50}} />
      ) : (
        <View>
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: 'bold',
              margin: 10,
            }}>
            Post Analytics (Today):{' '}
          </Text>
          <View
            style={{
              backgroundColor: '#1a1a1a',
              padding: 10,
              margin: 10,
              alignItems: 'center',
            }}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>
              Total Visits (Today)
            </Text>
            <Text style={{color: 'grey'}}>{visitDataPoints[15]}</Text>
          </View>
          <View
            style={{
              backgroundColor: '#1a1a1a',
              padding: 10,
              margin: 10,
              alignItems: 'center',
            }}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>
              Total Likes (Today)
            </Text>
            <Text style={{color: 'grey'}}>{likeDataPoints[15]}</Text>
          </View>
          <View
            style={{
              backgroundColor: '#1a1a1a',
              padding: 10,
              margin: 10,
              alignItems: 'center',
            }}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>
              Total Saves (Today)
            </Text>
            <Text style={{color: 'grey'}}>{saveDataPoints[15]}</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              margin: 10,
            }}>
            <Text style={{color: 'white', fontSize: 17, fontWeight: 'bold'}}>
              Show Values:{' '}
            </Text>
            <Switch
              value={showValues}
              onPress={() => setShowValues(!showValues)}
            />
          </View>
          {renderBarGraph()}
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: 'bold',
              margin: 10,
            }}>
            Post Analytics of past 2 weeks:{' '}
          </Text>
          <View
            style={{
              backgroundColor: '#1a1a1a',
              padding: 10,
              margin: 10,
              alignItems: 'center',
            }}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>
              Total Visits in past 2 weeks
            </Text>
            <Text style={{color: 'grey'}}>{completeSum(visitDataPoints)}</Text>
          </View>
          <View
            style={{
              backgroundColor: '#1a1a1a',
              padding: 10,
              margin: 10,
              alignItems: 'center',
            }}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>
              Total Likes in past 2 weeks
            </Text>
            <Text style={{color: 'grey'}}>{completeSum(likeDataPoints)}</Text>
          </View>
          <View
            style={{
              backgroundColor: '#1a1a1a',
              padding: 10,
              margin: 10,
              alignItems: 'center',
            }}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>
              Total Saves in past 2 weeks
            </Text>
            <Text style={{color: 'grey'}}>{completeSum(saveDataPoints)}</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              margin: 10,
            }}>
            <Text style={{color: 'white', fontSize: 17, fontWeight: 'bold'}}>
              Explore the BEZIER curve data.
            </Text>
            <Switch value={bezier} onPress={() => setBezier(!bezier)} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              margin: 10,
            }}>
            <Text style={{color: 'white', fontSize: 17, fontWeight: 'bold'}}>
              Show Data Points:{' '}
            </Text>
            <Switch
              value={showDataPoints}
              onPress={() => setShowDataPoints(!showDataPoints)}
            />
          </View>
          <ScrollView contentContainerStyle={{paddingBottom: 20}}>
            {renderCombinedChart()}
          </ScrollView>
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{tooltipData?.dateLabel}</Text>
            <Text style={styles.modalValue}>
              {tooltipData?.legend}: {tooltipData?.value}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
