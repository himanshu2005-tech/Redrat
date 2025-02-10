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

export default function NetworkAnalytics({route, navigation}) {
  const {network_id, networkDetails} = route.params;
  const [visitDataPoints, setVisitDataPoints] = useState([]);
  const [postDataPoints, setPostDataPoints] = useState([]);
  const [memberDataPoints, setMemberDataPoints] = useState([]);
  const [labels, setLabels] = useState([]);
  const [tooltipData, setTooltipData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bezier, setBezier] = useState(false);
  const [showDataPoints, setShowDataPoints] = useState(false);
  const [showValues, setShowValues] = useState(false);

  useEffect(() => {
    if (networkDetails.admin !== auth().currentUser.uid) {
      navigation.popToTop();
    }
  }, [network_id, networkDetails]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(today.getDate() - 14);
        twoWeeksAgo.setHours(0, 0, 0, 0);

        const visitSnapshot = await firestore()
          .collection('Network')
          .doc(network_id)
          .collection('Views')
          .where('visitedAt', '>=', firestore.Timestamp.fromDate(twoWeeksAgo))
          .where('visitedAt', '<=', firestore.Timestamp.fromDate(today))
          .get();

        const visitData = {};
        visitSnapshot.forEach(doc => {
          const visitDate = doc.data().visitedAt.toDate();
          const dateKey = visitDate.toISOString().split('T')[0];
          visitData[dateKey] = (visitData[dateKey] || 0) + 1;
        });

        const postSnapshot = await firestore()
          .collection('Posts')
          .where('network_id', '==', network_id)
          .where('createdAt', '>=', firestore.Timestamp.fromDate(twoWeeksAgo))
          .where('createdAt', '<=', firestore.Timestamp.fromDate(today))
          .get();

        const postData = {};
        postSnapshot.forEach(doc => {
          const postDate = doc.data().createdAt?.toDate();
          if (postDate) {
            const dateKey = postDate.toISOString().split('T')[0];
            postData[dateKey] = (postData[dateKey] || 0) + 1;
          }
        });

        const memberSnapshot = await firestore()
          .collection('Network')
          .doc(network_id)
          .collection('Members')
          .where('joined_at', '>=', firestore.Timestamp.fromDate(twoWeeksAgo))
          .where('joined_at', '<=', firestore.Timestamp.fromDate(today))
          .get();

        const memberData = {};
        memberSnapshot.forEach(doc => {
          const joinedDate = doc.data().joined_at?.toDate();
          if (joinedDate) {
            const dateKey = joinedDate.toISOString().split('T')[0];
            memberData[dateKey] = (memberData[dateKey] || 0) + 1;
          }
        });

        const visits = [];
        const posts = [];
        const members = [];
        const days = [];
        for (let i = 0; i < 16; i++) {
          const date = new Date(twoWeeksAgo);
          date.setDate(date.getDate() + i);
          const dateKey = date.toISOString().split('T')[0];
          days.push(moment(dateKey).format('MMM DD'));
          visits.push(visitData[dateKey] || 0);
          posts.push(postData[dateKey] || 0);
          members.push(memberData[dateKey] || 0);
        }

        setLabels(days);
        setVisitDataPoints(visits);
        setPostDataPoints(posts);
        setMemberDataPoints(members);
        console.log(members);
        console.log(posts);
        console.log(visits);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [network_id]);

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
    const maxValue = Math.max(
      ...visitDataPoints,
      ...postDataPoints,
      ...memberDataPoints,
    );

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Overall Network Analytics</Text>
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
                  data: postDataPoints,
                  color: () => chartColors.posts,
                  strokeWidth: 2,
                  legend: 'Posts',
                },
                {
                  data: memberDataPoints,
                  color: () => chartColors.members,
                  strokeWidth: 2,
                  legend: 'Members',
                },
              ],
              legend: ['Visits', 'Posts', 'Members'],
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

  const renderBarGraph = () => {
    const data = {
      labels: ['Visits', 'Posts', 'Members'],
      datasets: [
        {
          data: [visitDataPoints[15], postDataPoints[15], memberDataPoints[15]],
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
        <Text style={styles.chartTitle}>Network Analytics (Today)</Text>
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
          <Text style={styles.headerTitle}>Network Analytics Data</Text>
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
            Network Analytics (Today):{' '}
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
              Total Posts (Today)
            </Text>
            <Text style={{color: 'grey'}}>{postDataPoints[15]}</Text>
          </View>
          <View
            style={{
              backgroundColor: '#1a1a1a',
              padding: 10,
              margin: 10,
              alignItems: 'center',
            }}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>
              Total Engagement (Today)
            </Text>
            <Text style={{color: 'grey'}}>{memberDataPoints[15]}</Text>
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
            Network Analytics of past 2 weeks:{' '}
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
              Total Posts in past 2 weeks
            </Text>
            <Text style={{color: 'grey'}}>{completeSum(postDataPoints)}</Text>
          </View>
          <View
            style={{
              backgroundColor: '#1a1a1a',
              padding: 10,
              margin: 10,
              alignItems: 'center',
            }}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>
              Total Engagement in past 2 weeks
            </Text>
            <Text style={{color: 'grey'}}>{completeSum(memberDataPoints)}</Text>
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
