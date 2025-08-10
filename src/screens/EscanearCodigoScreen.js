// screens/EscanearCodigoScreen.js
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function EscanearCodigoScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);

    // Aquí puedes hacer la búsqueda del alimento con el código escaneado
    Alert.alert('Código escaneado', `Tipo: ${type}\nCódigo: ${data}`);
    
    // Por ejemplo: buscar en una API de alimentos por código de barras
    // buscarAlimentoPorCodigo(data);
  };

  if (hasPermission === null) {
    return <Text>Solicitando permiso para usar la cámara...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No se concedió acceso a la cámara.</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      {scanned && (
        <Button title={'Escanear de nuevo'} onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
