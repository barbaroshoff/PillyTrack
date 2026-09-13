import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useFontScale } from '../../context/FontScaleContext';
import { baseSizes } from '../../theme/typography';
import { lookupBarcode } from '../../services/barcode';
import { useScanFlowStore } from '../../store/scanFlowStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const FRAME = width * 0.7;

export default function ScanCameraScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const reset = useScanFlowStore((s) => s.reset);
  const setField = useScanFlowStore((s) => s.setField);

  React.useEffect(() => { reset(); }, []);

  const handleBarcode = useCallback(
    async (result: { data: string }) => {
      if (!scanning) return;
      setScanning(false);

      const barcode = result.data;
      const existing = await lookupBarcode(barcode);

      if (existing) {
        setField('existingMedicationId', existing.id);
        navigation.replace('RenewCourse', { medicationId: existing.id });
      } else {
        setField('barcode', barcode);
        navigation.navigate('ScanConfirm', { barcode });
      }
    },
    [scanning],
  );

  const goManual = () => {
    setScanning(false);
    navigation.navigate('ScanConfirm', {});
  };

  if (!permission) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
        <View style={s.center}>
          <Text style={[s.permText, { color: colors.textPrimary, fontSize: baseSizes.body * scale }]}>
            Нужен доступ к камере
          </Text>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.accent }]}
            onPress={requestPermission}
          >
            <Text style={[s.btnText, { fontSize: baseSizes.button * scale }]}>Разрешить</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.textBtn} onPress={goManual}>
            <Text style={{ color: colors.accent, fontSize: baseSizes.body * scale }}>
              Ввести вручную
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={scanning ? handleBarcode : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
      />

      {/* тёмный оверлей с вырезом */}
      <View style={s.overlay}>
        <View style={s.overlayTop} />
        <View style={s.overlayRow}>
          <View style={s.overlaySide} />
          <View style={[s.frame, { width: FRAME, height: FRAME }]}>
            <View style={[s.corner, s.tl]} />
            <View style={[s.corner, s.tr]} />
            <View style={[s.corner, s.bl]} />
            <View style={[s.corner, s.br]} />
          </View>
          <View style={s.overlaySide} />
        </View>
        <View style={s.overlayBottom} />
      </View>

      {/* UI поверх */}
      <SafeAreaView style={s.ui} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[s.cancel, { fontSize: baseSizes.body * scale }]}>Отмена</Text>
          </TouchableOpacity>
          <Text style={[s.title, { fontSize: baseSizes.title * scale }]}>Сканировать</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={s.hint}>
          <Text style={[s.hintText, { fontSize: baseSizes.caption * scale }]}>
            Наведите камеру на штрихкод упаковки
          </Text>
        </View>

        <TouchableOpacity style={[s.manualBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]} onPress={goManual}>
          <Text style={[s.manualText, { fontSize: baseSizes.button * scale }]}>Ввести вручную</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const CORNER = 20;
const BORDER = 3;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  permText: { textAlign: 'center', marginBottom: 8 },
  btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  btnText: { color: '#fff', fontWeight: '600' },
  textBtn: { marginTop: 8 },

  overlay: { ...StyleSheet.absoluteFill },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayRow: { flexDirection: 'row' },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { flex: 1.5, backgroundColor: 'rgba(0,0,0,0.6)' },
  frame: { position: 'relative' },

  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER },
  tr: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER },
  bl: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER },
  br: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER },

  ui: { ...StyleSheet.absoluteFill, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cancel: { color: '#fff' },
  title: { color: '#fff', fontWeight: '700' },
  hint: { alignItems: 'center' },
  hintText: { color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  manualBtn: {
    marginHorizontal: 32,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  manualText: { color: '#fff', fontWeight: '500' },
});
