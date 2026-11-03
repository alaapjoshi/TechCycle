import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Image, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import SelectDropdown from "react-native-select-dropdown";
import * as ImagePicker from "expo-image-picker";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, firebaseConfigured } from "../../firebase";
import { createListing } from "./listing.mjs";

const condition = ["New", "Like-new", "Good", "Fair", "Poor", "Used", "Refurbished", "Other"];

export default function Upload() {
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [condition2, setCondition2] = useState("");
  const [error, setError] = useState("");

  const pickImage = async () => {
    if (uploading) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 1,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImage(result.assets[0].uri);
        setError("");
      }
    } catch { setError("Could not open the image library. Please try again."); }
  };

  const handleSubmit = async () => {
    if (uploading) return;
    if (!firebaseConfigured) { setError("Run npm run setup and configure Firebase before adding an item."); return; }
    if (!deviceName.trim() || !image || !condition2 || !price.trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
      setError("Add a title, condition, image and a valid nonnegative price."); return;
    }
    setUploading(true);
    setError("");
    try {
      await createListing({ title: deviceName.trim(), desc: notes.trim(), price: price.trim(), condition: condition2, image }, {
        uploadImage: async (uri) => {
          const response = await fetch(uri);
          const blob = await response.blob();
          try {
            const imageRef = ref(storage, `Pictures/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
            await uploadBytes(imageRef, blob);
            return await getDownloadURL(imageRef);
          } finally { if (typeof blob.close === "function") blob.close(); }
        },
        saveDocument: (listing) => addDoc(collection(db, "foryou"), listing),
      });
      setDeviceName(""); setNotes(""); setPrice(""); setImage(null);
      Alert.alert("Successful", "Uploaded item to server!");
    } catch { setError("Could not save this item. Check your connection and Firebase Storage/Firestore rules. No success was reported."); }
    finally { setUploading(false); }
  };

  return (
    <ScrollView><View style={styles.container}>
      <Text style={{fontSize: 40, textAlign: 'center', marginBottom: 40, marginTop: 80}}>Upload an item!</Text>
      {!firebaseConfigured ? <Text>Firebase is not configured. Run npm run setup on your Mac.</Text> : null}
      <Text style={styles.label}>Title:</Text>
      <TextInput style={styles.input} placeholder="Title" value={deviceName} onChangeText={setDeviceName} editable={!uploading} />
      <Text style={styles.label}>Select Condition:</Text>
      <View style={{alignItems: "center"}}><SelectDropdown data={condition} defaultButtonText="Condition" disabled={uploading}
        onSelect={(selectedItem) => setCondition2(selectedItem)}
        buttonTextAfterSelection={(selectedItem) => selectedItem} rowTextForSelection={(item) => item} /></View>
      <Text style={styles.label}>Notes:</Text>
      <TextInput style={styles.input} placeholder="Description" value={notes} onChangeText={setNotes} editable={!uploading} />
      <Text style={styles.label}>Price:</Text>
      <TextInput style={styles.input} placeholder="Price in USD" value={price} onChangeText={setPrice} keyboardType="decimal-pad" editable={!uploading} />
      <TouchableOpacity style={styles.imageUploadButton} onPress={pickImage} disabled={uploading}><Text style={styles.buttonText}>Choose Image</Text></TouchableOpacity>
      {image ? <Image source={{uri: image}} style={styles.image} /> : null}
      {error ? <Text accessibilityRole="alert" style={{color: '#9b1c1c', marginVertical: 16}}>{error}</Text> : null}
      {uploading ? <ActivityIndicator accessibilityLabel="Uploading item" /> : null}
      <TouchableOpacity style={styles.addButton} onPress={handleSubmit} disabled={uploading}><Text style={styles.buttonText}>{uploading ? "Uploading..." : "Add Item"}</Text></TouchableOpacity>
    </View></ScrollView>
  );
}
// CSS 
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        marginBottom: 90
      },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 25,
    textAlign: 'center'
  },
  imageUploadButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#4CD964',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 10,
    alignContent: 'center',
    alignItems: 'center'
  },
  input: {
    height: 40,
    borderColor: "#3EB489",
    fontWeight: "bold",
    color: "#000000",
    borderWidth: 1,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  biginput: {
    height: 60,
    borderColor: "#3EB489",
    color: "#FFFFFF",
    borderWidth: 1,
    marginBottom: 10,
  },
  backgroundImage: {
    flex: 2,
    resizeMode: "cover", // or 'stretch'
  },
});