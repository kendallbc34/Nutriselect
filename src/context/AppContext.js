import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Estado comidas y calorías
  const [caloriasConsumidas, setCaloriasConsumidas] = useState(0);
  const [comidas, setComidas] = useState([]);

  // Estado actividades y calorías gastadas
  const [actividades, setActividades] = useState([]);
  const [caloriasGastadas, setCaloriasGastadas] = useState(0);

  // Registrar comida
  const registrarComida = (comida) => {
    setComidas(prev => [...prev, comida]);
    setCaloriasConsumidas(prev => prev + comida.calorias);
  };

  // Editar comida
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

  // Eliminar comida
  const eliminarComida = (id) => {
    setComidas(prev => {
      const comidaEliminada = prev.find(c => c.id === id);
      if (!comidaEliminada) return prev;

      setCaloriasConsumidas(current => current - comidaEliminada.calorias);

      return prev.filter(c => c.id !== id);
    });
  };

  // Registrar actividad
  const registrarActividad = (actividad) => {
    setActividades(prev => [...prev, actividad]);
    setCaloriasGastadas(prev => prev + actividad.calorias);
  };

  // Editar actividad
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

  // Eliminar actividad
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
        caloriasConsumidas,
        comidas,
        registrarComida,
        editarComida,
        eliminarComida,

        caloriasGastadas,
        actividades,
        registrarActividad,
        editarActividad,
        eliminarActividad,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
