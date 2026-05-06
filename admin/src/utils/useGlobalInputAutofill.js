import { useEffect } from 'react';

const STORAGE_KEY = 'mantri_global_input_autofill_v1';
const DATALIST_ID = 'mantri-global-autofill-list';
const MAX_VALUES_PER_FIELD = 25;

const isTextInput = (el) => {
  if (!el || el.tagName !== 'INPUT') return false;
  if (el.disabled || el.readOnly) return false;

  const type = (el.type || 'text').toLowerCase();
  return ['text', 'search', 'email', 'tel', 'url', 'number'].includes(type);
};

const getFieldKey = (input) => {
  const keyParts = [
    input.name,
    input.id,
    input.getAttribute('aria-label'),
    input.getAttribute('placeholder'),
  ].filter(Boolean);

  if (!keyParts.length) {
    return `field:${window.location.pathname}:unknown`;
  }

  return `field:${window.location.pathname}:${keyParts.join('|').trim().toLowerCase()}`;
};

const readStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStore = (store) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage failures (private mode/full storage).
  }
};

const ensureDatalist = () => {
  let datalist = document.getElementById(DATALIST_ID);
  if (datalist) return datalist;

  datalist = document.createElement('datalist');
  datalist.id = DATALIST_ID;
  document.body.appendChild(datalist);
  return datalist;
};

const updateDatalistOptions = (datalist, values) => {
  datalist.innerHTML = '';
  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    datalist.appendChild(option);
  });
};

const setNativeInputValue = (input, value) => {
  const prototype = Object.getPrototypeOf(input);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

  if (descriptor && descriptor.set) {
    descriptor.set.call(input, value);
  } else {
    input.value = value;
  }

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const findSuggestion = (store, input, currentValue) => {
  const trimmed = currentValue.trim();
  if (trimmed.length < 1) return null;

  const fieldKey = getFieldKey(input);
  const values = store[fieldKey] || [];
  const lower = trimmed.toLowerCase();

  return (
    values.find((item) => {
      const itemLower = item.toLowerCase();
      return itemLower.startsWith(lower) && itemLower !== lower;
    }) || null
  );
};

export default function useGlobalInputAutofill() {
  useEffect(() => {
    const store = readStore();
    const datalist = ensureDatalist();

    const syncInputList = (input) => {
      if (!isTextInput(input)) return;
      input.setAttribute('autocomplete', 'on');
      input.setAttribute('list', DATALIST_ID);

      const fieldKey = getFieldKey(input);
      const values = store[fieldKey] || [];
      const current = (input.value || '').trim().toLowerCase();
      const filtered = current
        ? values.filter((item) => item.toLowerCase().startsWith(current))
        : values;

      updateDatalistOptions(datalist, filtered.slice(0, 10));
    };

    const saveInputValue = (input) => {
      if (!isTextInput(input)) return;
      const value = (input.value || '').trim();
      if (!value) return;

      const fieldKey = getFieldKey(input);
      const previous = store[fieldKey] || [];
      const withoutDupes = previous.filter((item) => item.toLowerCase() !== value.toLowerCase());
      store[fieldKey] = [value, ...withoutDupes].slice(0, MAX_VALUES_PER_FIELD);
      writeStore(store);
    };

    const onFocusIn = (event) => {
      syncInputList(event.target);
    };

    const onInput = (event) => {
      syncInputList(event.target);
    };

    const onBlur = (event) => {
      saveInputValue(event.target);
    };

    const onKeyDown = (event) => {
      if (event.key !== 'Tab' || event.shiftKey) return;
      const input = event.target;
      if (!isTextInput(input)) return;

      const current = input.value || '';
      if (current.trim().length < 1) return;

      const suggestion = findSuggestion(store, input, current);
      if (!suggestion) return;

      event.preventDefault();
      setNativeInputValue(input, suggestion);
      const pos = suggestion.length;
      input.setSelectionRange(pos, pos);
    };

    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('input', onInput, true);
    document.addEventListener('focusout', onBlur, true);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('focusout', onBlur, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);
}
