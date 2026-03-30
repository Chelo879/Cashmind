/**
 * components/CashmindModal.js — v5 con validaciones completas
 * Validaciones por campo:
 *   - Campos requeridos marcados con *
 *   - Errores en rojo debajo del campo al instante
 *   - Numéricos no aceptan letras
 *   - Montos no pueden ser 0 ni negativos
 *   - Nombre máx 40 caracteres
 *   - Pago mínimo ≤ saldo
 *   - Plazo mínimo 1 mes
 *   - Fecha objetivo no puede ser pasada
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, Animated, Keyboard, Easing,
  Platform, TouchableWithoutFeedback,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import CashmindCalendar from './CashmindCalendar';
import { calcPaymentDeadline, formatDate, formatDateShort, nextBusinessDay } from '../utils/businessDays';
import {
  validateName, validateAmount, validatePercent,
  validateInteger, validateMinPayment, validateFutureDate,
  validateMonths, hasErrors,
} from '../utils/validators';

// ─── Constants ────────────────────────────────────────────────────────────────
const SAVING_ICONS = [
  { key: 'shield',        name: 'shield-checkmark' },
  { key: 'airplane',      name: 'airplane' },
  { key: 'laptop',        name: 'laptop' },
  { key: 'car',           name: 'car' },
  { key: 'home',          name: 'home' },
  { key: 'phone',         name: 'phone-portrait' },
  { key: 'school',        name: 'school' },
  { key: 'diamond',       name: 'diamond' },
  { key: 'barbell',       name: 'barbell' },
  { key: 'musical-notes', name: 'musical-notes' },
  { key: 'leaf',          name: 'leaf' },
  { key: 'medkit',        name: 'medkit' },
];
const CATEGORIES = [
  { key: 'credit_card', label: 'Tarjeta de crédito' },
  { key: 'personal',    label: 'Préstamo personal' },
  { key: 'mortgage',    label: 'Hipoteca' },
  { key: 'auto',        label: 'Crédito automotriz' },
  { key: 'other',       label: 'Otro' },
];
const PERIODICITIES = [
  { key: 'weekly',      label: 'Semanal' },
  { key: 'biweekly14',  label: 'Catorcenal' },
  { key: 'biweekly15',  label: 'Quincenal' },
  { key: 'monthly',     label: 'Mensual' },
];
const DEBT_COLORS = ['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#4F46E5'];

// ─── Helper local ────────────────────────────────────────────────────────────
function isBusinessDay(date) {
  const dow = date.getDay();
  return dow !== 0 && dow !== 6;
}

// ─── Toolbar "Listo" sticky dentro del ScrollView ────────────────────────────
function ListoBar({ visible }) {
  if (Platform.OS !== 'ios' || !visible) return null;
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'flex-end',
      paddingHorizontal: 16, paddingVertical: 8,
      borderTopWidth: 1, borderTopColor: 'rgba(99,102,241,0.2)',
      marginTop: 8,
    }}>
      <TouchableOpacity
        onPress={() => Keyboard.dismiss()}
        style={{
          backgroundColor: '#6366F1',
          paddingHorizontal: 24, paddingVertical: 8,
          borderRadius: 20,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Listo</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Reusable components ──────────────────────────────────────────────────────

/** Muestra error en rojo debajo del campo */
function FieldError({ error }) {
  if (!error) return null;
  return (
    <View style={styles.errorRow}>
      <Text style={styles.errorTxt}>⚠ {error}</Text>
    </View>
  );
}

/** Campo con label, * si requerido, hint opcional y error inline */
function Field({ label, required, hint, error, children }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      {children}
      <FieldError error={error} />
    </View>
  );
}

/** Input numérico o texto con borde rojo si hay error */
const NUMERIC_KEYBOARDS = ['decimal-pad', 'number-pad', 'numeric', 'phone-pad'];

function Input({ value, onChangeText, placeholder, keyboardType = 'default', prefix, hasError }) {
  const isNumeric = NUMERIC_KEYBOARDS.includes(keyboardType);
  return (
    <View style={styles.inputWrap}>
      {prefix ? <Text style={styles.inputPrefix}>{prefix}</Text> : null}
      <TextInput
        style={[
          styles.input,
          prefix && { paddingLeft: 32 },
          hasError && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function DateButton({ label, value, onPress, hasError }) {
  return (
    <TouchableOpacity
      style={[styles.dateBtn, hasError && styles.dateBtnError]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} />
      <Text style={[styles.dateBtnTxt, !value && styles.dateBtnPlaceholder]}>
        {value || label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function ChipSelector({ options, selected, onSelect }) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      decelerationRate="fast"
      directionalLockEnabled
      disableIntervalMomentum
      contentContainerStyle={styles.chips}
      style={{ marginHorizontal: -SPACING.xl, paddingHorizontal: SPACING.xl }}
    >
      {options.map((opt) => {
        const key    = typeof opt === 'string' ? opt : opt.key;
        const label  = typeof opt === 'string' ? opt : opt.label;
        const active = selected === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(key)}
          >
            <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
      <View style={{ width: SPACING.xxl }} />
    </ScrollView>
  );
}

// ─── Credit Card Form ─────────────────────────────────────────────────────────
function CreditCardForm({ onSave, onClose, initialData }) {
  const d = initialData ?? {};
  const [name,       setName]       = useState(d.label ?? '');
  const [balance,    setBalance]    = useState(d.totalAmount?.toString() ?? '');
  const [limit,      setLimit]      = useState(d.creditLimit?.toString() ?? '');
  const [cat,        setCat]        = useState(d.cat?.toString() ?? '');
  const [minPayment, setMinPayment] = useState(d.minPayment?.toString() ?? '');
  const [penalty,    setPenalty]    = useState(d.penalty?.toString() ?? '');
  const [cutDate,    setCutDate]    = useState(d.cutDate ? new Date(d.cutDate) : null);
  const [calVisible, setCalVisible] = useState(false);
  const [touched,    setTouched]    = useState({});

  const touch = (field) => setTouched((p) => ({ ...p, [field]: true }));

  // Live errors
  const errors = {
    name:       validateName(name),
    balance:    validateAmount(balance, 'El saldo'),
    limit:      validateAmount(limit, 'El límite'),
    cat:        validatePercent(cat, 200, 'El CAT'),
    minPayment: validateAmount(minPayment, 'El pago mínimo') || validateMinPayment(minPayment, balance),
    cutDate:    cutDate ? null : 'Selecciona la fecha de corte',
  };

  const paymentDeadline = cutDate ? calcPaymentDeadline(cutDate) : null;
  const isOverLimit     = balance && limit && parseFloat(balance) > parseFloat(limit);
  const canSave         = !hasErrors(errors);

  const handleSave = () => {
    // Marcar todos como tocados para mostrar todos los errores
    setTouched({ name: true, balance: true, limit: true, cat: true, minPayment: true, cutDate: true });
    if (!canSave) return;
    onSave({
      id:           d.id ?? Date.now().toString(),
      label:        name.trim(),
      category:     'Tarjeta de crédito',
      categoryKey:  'credit_card',
      totalAmount:  parseFloat(balance),
      paidAmount:   d.paidAmount ?? 0,
      creditLimit:  parseFloat(limit),
      cat:          parseFloat(cat),
      minPayment:   parseFloat(minPayment),
      penalty:      parseFloat(penalty) || 0,
      cutDate:      cutDate.toISOString(),
      dueDateLabel: formatDateShort(paymentDeadline),
      interestRate: parseFloat(cat),
      color:        DEBT_COLORS[0],
    });
    onClose();
  };

  return (
    <>
      <Field label="Nombre de la tarjeta" required error={touched.name && errors.name}>
        <Input
          value={name} onChangeText={(v) => { setName(v); touch('name'); }}
          placeholder="Ej. Tarjeta Banamex"
          hasError={!!(touched.name && errors.name)}
        />
      </Field>

      <Field label="Saldo actual" required hint="Lo que debes hoy" error={touched.balance && errors.balance}>
        <Input
          value={balance} onChangeText={(v) => { setBalance(v); touch('balance'); }}
          placeholder="0.00" keyboardType="decimal-pad" prefix="$"
          hasError={!!(touched.balance && errors.balance)}
        />
        {isOverLimit && !errors.balance && (
          <View style={styles.alertRow}>
            <Ionicons name="warning" size={14} color={COLORS.danger} style={{marginRight: 4}} />
            <Text style={styles.alertTxt}>Tu saldo supera el límite de crédito</Text>
          </View>
        )}
      </Field>

      <Field label="Límite de crédito" required hint="Límite autorizado por el banco" error={touched.limit && errors.limit}>
        <Input
          value={limit} onChangeText={(v) => { setLimit(v); touch('limit'); }}
          placeholder="0.00" keyboardType="decimal-pad" prefix="$"
          hasError={!!(touched.limit && errors.limit)}
        />
      </Field>

      <Field label="CAT" required hint="Costo Anual Total (%)" error={touched.cat && errors.cat}>
        <Input
          value={cat} onChangeText={(v) => { setCat(v); touch('cat'); }}
          placeholder="Ej. 36" keyboardType="decimal-pad" prefix="%"
          hasError={!!(touched.cat && errors.cat)}
        />
      </Field>

      <Field label="Pago mínimo" required hint="mi — mínimo exigido" error={touched.minPayment && errors.minPayment}>
        <Input
          value={minPayment} onChangeText={(v) => { setMinPayment(v); touch('minPayment'); }}
          placeholder="0.00" keyboardType="decimal-pad" prefix="$"
          hasError={!!(touched.minPayment && errors.minPayment)}
        />
      </Field>

      <Field label="Penalización" hint="M — multas + intereses (opcional)">
        <Input value={penalty} onChangeText={setPenalty} placeholder="0.00" keyboardType="decimal-pad" prefix="$" />
      </Field>

      <Field label="Fecha de corte" required error={touched.cutDate && errors.cutDate}>
        <DateButton
          label="Selecciona la fecha de corte"
          value={cutDate ? formatDate(cutDate) : null}
          onPress={() => setCalVisible(true)}
          hasError={!!(touched.cutDate && errors.cutDate)}
        />
        {cutDate && paymentDeadline && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
            <Text style={styles.infoTxt}>
              Fecha límite:{' '}
              <Text style={styles.infoHighlight}>{formatDate(paymentDeadline)}</Text>
              {' '}(+20 días hábiles)
            </Text>
          </View>
        )}
      </Field>

      <TouchableOpacity
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={handleSave} activeOpacity={0.85}
      >
        <Text style={styles.saveBtnTxt}>{initialData ? 'Guardar cambios' : 'Agregar tarjeta'}</Text>
      </TouchableOpacity>

      <CashmindCalendar
        visible={calVisible}
        selectedDate={cutDate}
        onSelect={(d) => { setCutDate(d); touch('cutDate'); setCalVisible(false); }}
        onClose={() => setCalVisible(false)}
        businessOnly={false}
        title="Fecha de corte"
      />
    </>
  );
}

// ─── Loan Form ────────────────────────────────────────────────────────────────
function LoanForm({ categoryKey, categoryLabel, onSave, onClose, initialData }) {
  const d = initialData ?? {};
  const [name,         setName]         = useState(d.label ?? '');
  const [balance,      setBalance]      = useState(d.totalAmount?.toString() ?? '');
  const [cat,          setCat]          = useState(d.cat?.toString() ?? '');
  const [periodicity,  setPeriodicity]  = useState(d.periodicity ?? 'monthly');
  const [firstPayDate, setFirstPayDate] = useState(d.firstPayDate ? new Date(d.firstPayDate) : null);
  const [paymentsLeft, setPaymentsLeft] = useState(d.paymentsLeft?.toString() ?? '');
  const [calVisible,   setCalVisible]   = useState(false);
  const [touched,      setTouched]      = useState({});

  const touch = (field) => setTouched((p) => ({ ...p, [field]: true }));

  const errors = {
    name:         validateName(name),
    balance:      validateAmount(balance, 'El saldo'),
    cat:          validatePercent(cat, 200, 'El CAT'),
    firstPayDate: firstPayDate ? null : 'Selecciona la fecha de primer pago',
    paymentsLeft: validateInteger(paymentsLeft, 1, 'El número de pagos'),
  };

  const canSave = !hasErrors(errors);

  const handleSave = () => {
    setTouched({ name: true, balance: true, cat: true, firstPayDate: true, paymentsLeft: true });
    if (!canSave) return;
    onSave({
      id:           d.id ?? Date.now().toString(),
      label:        name.trim(),
      category:     categoryLabel,
      categoryKey,
      totalAmount:  parseFloat(balance),
      paidAmount:   d.paidAmount ?? 0,
      cat:          parseFloat(cat),
      periodicity,
      firstPayDate: firstPayDate.toISOString(),
      paymentsLeft: parseInt(paymentsLeft),
      dueDateLabel: formatDateShort(nextBusinessDay(firstPayDate)),
      interestRate: parseFloat(cat),
      color:        DEBT_COLORS[1],
      minPayment:   parseFloat(balance) / parseInt(paymentsLeft),
    });
    onClose();
  };

  return (
    <>
      <Field label="Nombre del crédito" required error={touched.name && errors.name}>
        <Input
          value={name} onChangeText={(v) => { setName(v); touch('name'); }}
          placeholder={`Ej. ${categoryLabel}`}
          hasError={!!(touched.name && errors.name)}
        />
      </Field>

      <Field label="Saldo total" required hint="Lo que debes actualmente" error={touched.balance && errors.balance}>
        <Input
          value={balance} onChangeText={(v) => { setBalance(v); touch('balance'); }}
          placeholder="0.00" keyboardType="decimal-pad" prefix="$"
          hasError={!!(touched.balance && errors.balance)}
        />
      </Field>

      <Field label="CAT" required hint="Costo Anual Total (%)" error={touched.cat && errors.cat}>
        <Input
          value={cat} onChangeText={(v) => { setCat(v); touch('cat'); }}
          placeholder="Ej. 24" keyboardType="decimal-pad" prefix="%"
          hasError={!!(touched.cat && errors.cat)}
        />
      </Field>

      <Field label="Periodicidad de pago" required>
        <ChipSelector options={PERIODICITIES} selected={periodicity} onSelect={setPeriodicity} />
      </Field>

      <Field label="Fecha de primer pago" required error={touched.firstPayDate && errors.firstPayDate}>
        <DateButton
          label="Selecciona la fecha"
          value={firstPayDate ? formatDate(nextBusinessDay(firstPayDate)) : null}
          onPress={() => setCalVisible(true)}
          hasError={!!(touched.firstPayDate && errors.firstPayDate)}
        />
        {firstPayDate && !isBusinessDay(firstPayDate) && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
            <Text style={styles.infoTxt}>
              Ajustado a día hábil:{' '}
              <Text style={styles.infoHighlight}>{formatDate(nextBusinessDay(firstPayDate))}</Text>
            </Text>
          </View>
        )}
      </Field>

      <Field label="Número de pagos totales" required error={touched.paymentsLeft && errors.paymentsLeft}>
        <Input
          value={paymentsLeft} onChangeText={(v) => { setPaymentsLeft(v); touch('paymentsLeft'); }}
          placeholder="Ej. 24" keyboardType="number-pad"
          hasError={!!(touched.paymentsLeft && errors.paymentsLeft)}
        />
      </Field>

      <TouchableOpacity
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={handleSave} activeOpacity={0.85}
      >
        <Text style={styles.saveBtnTxt}>{initialData ? 'Guardar cambios' : 'Agregar crédito'}</Text>
      </TouchableOpacity>

      <CashmindCalendar
        visible={calVisible}
        selectedDate={firstPayDate}
        onSelect={(d) => { setFirstPayDate(d); touch('firstPayDate'); setCalVisible(false); }}
        onClose={() => setCalVisible(false)}
        businessOnly={false}
        title="Fecha de primer pago"
      />
    </>
  );
}

// ─── Saving Form ──────────────────────────────────────────────────────────────
function SavingForm({ onSave, onClose, initialData }) {
  const d = initialData ?? {};
  const [name,       setName]       = useState(d.label ?? '');
  const [goal,       setGoal]       = useState(d.goal?.toString() ?? '');
  const [months,     setMonths]     = useState(d.months?.toString() ?? '');
  const [targetDate, setTargetDate] = useState(null);
  const [iconKey,    setIconKey]    = useState(d.iconKey ?? 'shield');
  const [calVisible, setCalVisible] = useState(false);
  const [touched,    setTouched]    = useState({});

  const touch = (field) => setTouched((p) => ({ ...p, [field]: true }));

  const monthlyDeposit =
    goal && months && parseFloat(months) > 0
      ? parseFloat(goal) / parseFloat(months)
      : null;

  const errors = {
    name:       validateName(name),
    goal:       validateAmount(goal, 'La meta'),
    months:     validateMonths(months),
    targetDate: validateFutureDate(targetDate),
  };

  const canSave = !hasErrors(errors);

  const handleSave = () => {
    setTouched({ name: true, goal: true, months: true, targetDate: true });
    if (!canSave) return;
    onSave({
      id:             d.id ?? Date.now().toString(),
      label:          name.trim(),
      goal:           parseFloat(goal),
      saved:          d.saved ?? 0,
      months:         months ? parseInt(months) : null,
      monthlyDeposit: monthlyDeposit ?? null,
      targetDate:     formatDateShort(targetDate),
      iconKey,
      color:          DEBT_COLORS[0],
    });
    onClose();
  };

  return (
    <>
      <Field label="Nombre del objetivo" required error={touched.name && errors.name}>
        <Input
          value={name} onChangeText={(v) => { setName(v); touch('name'); }}
          placeholder="Ej. Fondo de emergencia"
          hasError={!!(touched.name && errors.name)}
        />
      </Field>

      <Field label="Ícono">
        <View style={styles.emojiGrid}>
          {SAVING_ICONS.map((ic) => (
            <TouchableOpacity
              key={ic.key}
              style={[styles.emojiBtn, iconKey === ic.key && styles.emojiBtnActive]}
              onPress={() => setIconKey(ic.key)}
            >
              <Ionicons
                name={ic.name}
                size={22}
                color={iconKey === ic.key ? COLORS.primary : COLORS.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Meta total" required error={touched.goal && errors.goal}>
        <Input
          value={goal} onChangeText={(v) => { setGoal(v); touch('goal'); }}
          placeholder="0.00" keyboardType="decimal-pad" prefix="$"
          hasError={!!(touched.goal && errors.goal)}
        />
      </Field>

      <Field label="Plazo en meses" hint="Opcional" error={touched.months && errors.months}>
        <Input
          value={months} onChangeText={(v) => { setMonths(v); touch('months'); }}
          placeholder="Ej. 6" keyboardType="number-pad"
          hasError={!!(touched.months && errors.months)}
        />
        {monthlyDeposit !== null && !errors.months && (
          <View style={styles.depositSuggestion}>
            <View style={styles.depositLeft}>
              <Ionicons name="bulb-outline" size={16} color={COLORS.primary} />
              <Text style={styles.depositLabel}>Depósito mensual sugerido</Text>
            </View>
            <Text style={styles.depositValue}>
              ${monthlyDeposit.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        )}
      </Field>

      <Field label="Fecha objetivo" required error={touched.targetDate && errors.targetDate}>
        <DateButton
          label="Selecciona la fecha objetivo"
          value={targetDate ? formatDate(targetDate) : null}
          onPress={() => setCalVisible(true)}
          hasError={!!(touched.targetDate && errors.targetDate)}
        />
      </Field>

      <TouchableOpacity
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={handleSave} activeOpacity={0.85}
      >
        <Text style={styles.saveBtnTxt}>{initialData ? 'Guardar cambios' : 'Agregar objetivo'}</Text>
      </TouchableOpacity>

      <CashmindCalendar
        visible={calVisible}
        selectedDate={targetDate}
        onSelect={(d) => { setTargetDate(d); touch('targetDate'); setCalVisible(false); }}
        onClose={() => setCalVisible(false)}
        businessOnly={false}
        title="Fecha objetivo de ahorro"
      />
    </>
  );
}

// ─── Budget Form ──────────────────────────────────────────────────────────────
function BudgetForm({ currentBudget, onSave, onClose }) {
  const [budget,  setBudget]  = useState(currentBudget?.toString() || '');
  const [touched, setTouched] = useState(false);

  const error   = validateAmount(budget, 'El presupuesto');
  const canSave = !error;

  return (
    <>
      <View style={styles.budgetInfo}>
        <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
        <Text style={styles.budgetInfoTxt}>
          Este es tu presupuesto mensual (P). El sistema lo usará para optimizar tus pagos con el modelo Simplex.
        </Text>
      </View>
      <Field label="Presupuesto mensual" required hint="P — total disponible" error={touched && error}>
        <Input
          value={budget}
          onChangeText={(v) => { setBudget(v); setTouched(true); }}
          placeholder="0.00" keyboardType="decimal-pad" prefix="$"
          hasError={!!(touched && error)}
        />
      </Field>
      <TouchableOpacity
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={() => { setTouched(true); if (canSave) { onSave(parseFloat(budget)); onClose(); } }}
        activeOpacity={0.85}
      >
        <Text style={styles.saveBtnTxt}>Guardar presupuesto</Text>
      </TouchableOpacity>
    </>
  );
}

// ─── Debt Router ──────────────────────────────────────────────────────────────
function DebtForm({ onSave, onClose, initialData }) {
  const [category, setCategory] = useState(initialData?.categoryKey ?? 'credit_card');
  const selectedCat = CATEGORIES.find((c) => c.key === category);
  return (
    <>
      {!initialData && (
        <Field label="Categoría" required>
          <ChipSelector options={CATEGORIES} selected={category} onSelect={setCategory} />
        </Field>
      )}
      {category === 'credit_card' ? (
        <CreditCardForm onSave={onSave} onClose={onClose} initialData={initialData} />
      ) : (
        <LoanForm
          key={category}
          categoryKey={category}
          categoryLabel={selectedCat?.label ?? 'Crédito'}
          onSave={onSave}
          onClose={onClose}
          initialData={initialData}
        />
      )}
    </>
  );
}


// ─── Hook: altura del teclado ────────────────────────────────────────────────
function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);
  return keyboardHeight;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function CashmindModal({
  visible, type = 'debt', onClose,
  onSaveDebt, onSaveSaving, onSaveBudget, currentBudget = 0,
  initialData = null,
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const keyboardHeight = useKeyboardHeight();

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, { toValue: 0, duration: 320, useNativeDriver: true, easing: Easing.out(Easing.cubic) }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 260, useNativeDriver: true, easing: Easing.in(Easing.cubic) }).start();
    }
  }, [visible]);

  const esEdicion = !!initialData;
  const titles = {
    debt:   esEdicion ? 'Editar deuda'    : 'Nueva deuda',
    saving: esEdicion ? 'Editar objetivo' : 'Nuevo ahorro',
    budget: 'Presupuesto mensual',
  };
  const iconNames = { debt: 'card', saving: 'wallet', budget: 'cash' };

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], bottom: keyboardHeight }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetIconWrap}>
              <Ionicons name={iconNames[type]} size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.sheetTitle}>{titles[type]}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bounces={false}
          >
            {type === 'debt'   && <DebtForm   onSave={onSaveDebt}   onClose={onClose} initialData={initialData} />}
            {type === 'saving' && <SavingForm onSave={onSaveSaving} onClose={onClose} initialData={initialData} />}
            {type === 'budget' && <BudgetForm onSave={onSaveBudget} onClose={onClose} currentBudget={currentBudget} />}
          </ScrollView>
          <ListoBar visible={keyboardHeight > 0} />
        </Animated.View>
      </View>
    </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '92%',
    borderTopWidth: 1, borderColor: COLORS.cardBorder,
  },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.textMuted, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  sheetIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryAlpha12, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  sheetTitle:  { flex: 1, fontSize: FONTS.lg, fontWeight: '700', color: COLORS.textPrimary },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center' },
  sheetContent:{ padding: SPACING.xl, paddingBottom: 48 },

  field:       { marginBottom: SPACING.lg },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  fieldLabel:  { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textPrimary },
  required:    { color: COLORS.danger, fontWeight: '700' },
  fieldHint:   { fontSize: FONTS.sm, color: COLORS.primary },

  errorRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  errorTxt: { fontSize: FONTS.sm, color: COLORS.danger },

  inputWrap:   { position: 'relative' },
  inputPrefix: { position: 'absolute', left: 12, top: 14, fontSize: FONTS.base, color: COLORS.textMuted, zIndex: 1 },
  input: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    fontSize: FONTS.base, color: COLORS.textPrimary,
  },
  inputError: { borderColor: COLORS.danger, borderWidth: 1.5 },

  chips:      { gap: SPACING.sm },
  chip:       { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.xl, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder },
  chipActive: { backgroundColor: COLORS.primaryAlpha12, borderColor: COLORS.primary },
  chipTxt:    { fontSize: FONTS.sm, color: COLORS.textMuted, fontWeight: '500' },
  chipTxtActive: { color: COLORS.primary, fontWeight: '700' },

  dateBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm,
  },
  dateBtnError:       { borderColor: COLORS.danger, borderWidth: 1.5 },
  dateBtnTxt:         { flex: 1, fontSize: FONTS.base, color: COLORS.textPrimary },
  dateBtnPlaceholder: { color: COLORS.textMuted },

  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginTop: SPACING.sm, gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.primaryAlpha30,
  },
  infoTxt:       { flex: 1, fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },
  infoHighlight: { color: COLORS.primary, fontWeight: '700' },

  alertRow: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: RADIUS.md, padding: SPACING.sm, marginTop: SPACING.sm, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  alertTxt:  { fontSize: FONTS.sm, color: COLORS.danger },

  emojiGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  emojiBtn:       { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { backgroundColor: COLORS.primaryAlpha12, borderColor: COLORS.primary },

  depositSuggestion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primaryAlpha12, borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: COLORS.primaryAlpha30 },
  depositLeft:       { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  depositLabel:      { fontSize: 12, color: COLORS.textMuted },
  depositValue:      { fontSize: 15, fontWeight: '700', color: COLORS.primary },

  budgetInfo:    { flexDirection: 'row', backgroundColor: COLORS.primaryAlpha12, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.primaryAlpha30, marginBottom: SPACING.lg, gap: SPACING.sm, alignItems: 'flex-start' },
  budgetInfoTxt: { flex: 1, fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },

  saveBtn:         { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', marginTop: SPACING.sm },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnTxt:      { fontSize: FONTS.md, fontWeight: '700', color: COLORS.white },
});
