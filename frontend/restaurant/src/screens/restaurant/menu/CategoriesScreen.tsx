import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ViewStyle, TextStyle } from 'react-native';
import { globalStyles } from '../../../../styles/global';
import { Colors } from '../../../../constants/Colors';
import { Card } from '../../../../components/common/Card';
import { Input } from '../../../../components/common/Input';
import { Button } from '../../../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CategoryManagementScreen() {
  const [categories, setCategories] = useState(['Appetizers', 'Main Course', 'Desserts', 'Beverages']);
  const [newCategory, setNewCategory] = useState('');
  const router = useRouter();

  const handleAddCategory = () => {
    if (!newCategory) return;
    setCategories([...categories, newCategory]);
    setNewCategory('');
  };

  const handleDeleteCategory = (index: number) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? Items in this category will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const updated = [...categories];
            updated.splice(index, 1);
            setCategories(updated);
          }
        }
      ]
    );
  };

  return (
    <View style={globalStyles.container as ViewStyle}>
      <View style={styles.header as ViewStyle}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title as TextStyle}>Categories</Text>
      </View>

      <Card style={styles.addCard as ViewStyle}>
        <Text style={styles.label as TextStyle}>Add New Category</Text>
        <View style={styles.inputRow as ViewStyle}>
          <Input 
            placeholder="Category Name"
            value={newCategory}
            onChangeText={setNewCategory}
            style={styles.input}
          />
          <Button 
            title="Add" 
            onPress={handleAddCategory} 
            style={styles.addButton}
          />
        </View>
      </Card>

      <FlatList
        data={categories}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Card style={styles.categoryCard as ViewStyle}>
            <Text style={styles.categoryName as TextStyle}>{item}</Text>
            <TouchableOpacity onPress={() => handleDeleteCategory(index)}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addCard: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginBottom: 0,
    marginRight: 12,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
});
