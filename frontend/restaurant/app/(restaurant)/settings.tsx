import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { globalStyles } from '../../styles/global';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/common/Card';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(true);
  const [marketing, setMarketing] = React.useState(false);

  const SettingItem = ({ icon, label, value, onValueChange, type = 'switch' }: any) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLabelContainer}>
        <Ionicons name={icon} size={22} color={Colors.text} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {type === 'switch' ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange}
          trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
          thumbColor={value ? Colors.primary : '#f4f3f4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={Colors.text + '40'} />
      )}
    </View>
  );

  return (
    <ScrollView style={globalStyles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card>
          <SettingItem 
            icon="notifications-outline" 
            label="Push Notifications" 
            value={notifications} 
            onValueChange={setNotifications} 
          />
          <View style={styles.divider} />
          <SettingItem 
            icon="mail-outline" 
            label="Email Marketing" 
            value={marketing} 
            onValueChange={setMarketing} 
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account & Security</Text>
        <Card>
          <TouchableOpacity onPress={() => {}}>
            <SettingItem icon="lock-closed-outline" label="Change Password" type="link" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity onPress={() => {}}>
            <SettingItem icon="shield-checkmark-outline" label="Privacy Policy" type="link" />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        <Card>
          <TouchableOpacity onPress={() => {}}>
            <SettingItem icon="language-outline" label="Language" type="link" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity onPress={() => {}}>
            <SettingItem icon="information-circle-outline" label="App Version" type="link" />
          </TouchableOpacity>
        </Card>
      </View>

      <TouchableOpacity style={styles.deleteAccount} onPress={() => {}}>
        <Text style={styles.deleteAccountText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  deleteAccount: {
    margin: 32,
    alignItems: 'center',
    padding: 16,
  },
  deleteAccountText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
