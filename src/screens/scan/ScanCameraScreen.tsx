import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useFontScale } from '../../context/FontScaleContext';
import { baseSizes } from '../../theme/typography';
import { useScanFlowStore } from '../../store/scanFlowStore';
import { recognizeMedicationFromPhoto } from '../../services/medicationAI';
import { PROXY_URL } from '../../config';
import type { ScanFlowParamList } from '../../navigation/ScanFlowNavigator';

type Nav = NativeStackNavigationProp<ScanFlowParamList>;

const { width } = Dimensions.get('window');
const FRAME_W = width * 0.82;
const FRAME_H = FRAME_W * 0.6;
const CORNER = 22;
const BORDER = 3;

export default function ScanCameraScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const reset = useScanFlowStore((s) => s.reset);
  const setField = useScanFlowStore((s) => s.setField);

  useFocusEffect(
    React.useCallback(() => {
      reset();
      setProcessing(false);
    }, []),
  );

  const handleCapture = async () => {
    if (processing || !cameraRef.current) return;
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.75 });
      if (!photo) throw new Error(t('scan_error_title'));

      setField('photoUri', photo.uri);
      const info = await recognizeMedicationFromPhoto(photo.uri, PROXY_URL, i18n.language);
      navigation.navigate('MedicationInfo', { info, photoUri: photo.uri });
    } catch (e: any) {
      Alert.alert(t('scan_error_title'), e.message ?? t('scan_error_body'));
      setProcessing(false);
    }
  };

  const pickFromGallery = async () => {
    if (processing) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
    });
    if (res.canceled || !res.assets[0]) return;

    setProcessing(true);
    try {
      const uri = res.assets[0].uri;
      setField('photoUri', uri);
      const info = await recognizeMedicationFromPhoto(uri, PROXY_URL, i18n.language);
      navigation.navigate('MedicationInfo', { info, photoUri: uri });
    } catch (e: any) {
      Alert.alert(t('scan_error_title'), e.message ?? t('scan_error_body'));
      setProcessing(false);
    }
  };

  const goManual = () => navigation.navigate('ScanConfirm', {});

  if (!permission) {
    return (
      <View style={[s.center, { backgroundColor: '#000' }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
        <View style={s.center}>
          <Text style={[s.permText, { color: colors.textPrimary, fontSize: baseSizes.body * scale }]}>
            {t('scan_permission')}
          </Text>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.accent }]}
            onPress={requestPermission}
          >
            <Text style={[s.btnText, { fontSize: baseSizes.button * scale }]}>{t('scan_allow')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.textBtn} onPress={pickFromGallery}>
            <Text style={{ color: colors.accent, fontSize: baseSizes.body * scale }}>
              {t('scan_gallery')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.textBtn} onPress={goManual}>
            <Text style={{ color: colors.accent, fontSize: baseSizes.body * scale }}>
              {t('scan_manual')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />

      {/* Затемнённый оверлей с вырезом под упаковку */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={s.overlayTop} />
        <View style={s.overlayRow}>
          <View style={s.overlaySide} />
          <View style={{ width: FRAME_W, height: FRAME_H }}>
            <View style={[s.corner, s.tl]} />
            <View style={[s.corner, s.tr]} />
            <View style={[s.corner, s.bl]} />
            <View style={[s.corner, s.br]} />
          </View>
          <View style={s.overlaySide} />
        </View>
        <View style={s.overlayBottom} />
      </View>

      <SafeAreaView style={s.ui} edges={['top', 'bottom']}>
        {/* Шапка */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[s.cancel, { fontSize: baseSizes.body * scale }]}>{t('cancel')}</Text>
          </TouchableOpacity>
          <Text style={[s.title, { fontSize: baseSizes.title * scale }]}>{t('scan_photo_title')}</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Подсказка */}
        <View style={s.hint}>
          <Text style={[s.hintText, { fontSize: baseSizes.caption * scale }]}>
            {processing ? t('scan_processing') : t('scan_hint_auto')}
          </Text>
        </View>

        {/* Нижняя панель */}
        <View style={s.bottom}>
          <TouchableOpacity onPress={goManual} style={s.manualWrap}>
            <Text style={[s.manualText, { fontSize: baseSizes.caption * scale }]}>
              {t('scan_manual')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.captureBtn} onPress={handleCapture} disabled={processing}>
            {processing ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <View style={s.captureInner} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={pickFromGallery} style={s.manualWrap} disabled={processing}>
            <Text style={{ fontSize: 26 }}>🖼️</Text>
            <Text style={[s.manualText, { fontSize: baseSizes.caption * scale }]}>
              {t('scan_gallery')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  permText: { textAlign: 'center', marginBottom: 8 },
  btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  btnText: { color: '#fff', fontWeight: '600' },
  textBtn: { marginTop: 8 },

  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)' },
  overlayRow: { flexDirection: 'row', height: FRAME_H },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)' },
  overlayBottom: { flex: 1.8, backgroundColor: 'rgba(0,0,0,0.58)' },

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
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  cancel: { color: '#fff' },
  title: { color: '#fff', fontWeight: '700' },
  hint: { alignItems: 'center', paddingHorizontal: 32 },
  hintText: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  manualWrap: { width: 64, alignItems: 'center' },
  manualText: { color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 18 },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
});
