import React, { createContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [comidas, setComidas] = useState([]);
  const [caloriasConsumidas, setCaloriasConsumidas] = useState(0);
  const [actividades, setActividades] = useState([]);
  const [caloriasGastadas, setCaloriasGastadas] = useState(0);
  const [user, setUser] = useState(null);

  const auth = getAuth();

  // 🔥 Escucha cambios de sesión del usuario (esto es lo que faltaba)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  // 🔥 Escucha en tiempo real de comidas guardadas en Firebase
  useEffect(() => {
    if (!user) return;

    const comidasRef = collection(db, 'usuarios', user.uid, 'comidas');
    const q = query(comidasRef, orderBy('fecha', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComidas(data);

      // Calcular total de calorías consumidas
      const total = data.reduce((sum, item) => sum + (Number(item.calorias) || 0), 0);
      setCaloriasConsumidas(total);
    });

    return unsubscribe;
  }, [user]);

  // 🔥 Escucha en tiempo real de actividades guardadas en Firebase
  useEffect(() => {
    if (!user) return;

    const actividadesRef = collection(db, 'usuarios', user.uid, 'actividades');
    const q = query(actividadesRef, orderBy('fecha', 'desc'));


    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActividades(data);

      // Calcular total de calorías gastadas
      const total = data.reduce((sum, item) => sum + (Number(item.calorias) || 0), 0);
      setCaloriasGastadas(total);
    });

    return unsubscribe;
  }, [user]);

  // 🥗 Funciones locales (útiles si registras sin Firebase todavía)
  const registrarComida = (comida) => {
    setComidas(prev => [...prev, comida]);
    setCaloriasConsumidas(prev => prev + comida.calorias);
  };

  const editarComida = (comidaEditada) => {
    setComidas(prev => {
      const comidaAnterior = prev.find(c => c.id === comidaEditada.id);
      if (!comidaAnterior) return prev;

      setCaloriasConsumidas(current =>
        current - comidaAnterior.calorias + comidaEditada.calorias
      );

      return prev.map(c => c.id === comidaEditada.id ? comidaEditada : c);
    });
  };

  const eliminarComida = (id) => {
    setComidas(prev => {
      const comidaEliminada = prev.find(c => c.id === id);
      if (!comidaEliminada) return prev;

      setCaloriasConsumidas(current => current - comidaEliminada.calorias);
      return prev.filter(c => c.id !== id);
    });
  };


  const registrarActividad = (actividad) => {
    setActividades(prev => [...prev, actividad]);
    setCaloriasGastadas(prev => prev + actividad.calorias);
  };

  const editarActividad = (actividadEditada) => {
    setActividades(prev => {
      const actividadAnterior = prev.find(a => a.id === actividadEditada.id);
      if (!actividadAnterior) return prev;

      setCaloriasGastadas(current =>
        current - actividadAnterior.calorias + actividadEditada.calorias
      );

      return prev.map(a => a.id === actividadEditada.id ? actividadEditada : a);
    });
  };

  const eliminarActividad = (id) => {
    setActividades(prev => {
      const actividadEliminada = prev.find(a => a.id === id);
      if (!actividadEliminada) return prev;

      setCaloriasGastadas(current => current - actividadEliminada.calorias);
      return prev.filter(a => a.id !== id);
    });
  };

  return (
    <AppContext.Provider
      value={{
        comidas,
        caloriasConsumidas,
        registrarComida,
        editarComida,
        eliminarComida,

        actividades,
        caloriasGastadas,
        registrarActividad,
        editarActividad,
        eliminarActividad,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
