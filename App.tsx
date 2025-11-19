import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SupabaseService from './services/supabaseService';
import { SupabaseClient, Session } from '@supabase/supabase-js';
import { SalesNumber, Product, Status, PhoneNumberLabel, PositionLabel, ChannelType, ActivityLog, ColumnDefinition } from './types';
import SalesNumberTable from './components/SalesNumberTable';
import MultiSelectDropdown from './components/MultiSelectDropdown';
import GenericSidePanel from './components/GenericSidePanel';
import NotesPanel from './components/NotesPanel';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import { AddIcon, DashboardIcon, HistoryIcon, DataIcon, AddCircleIcon } from './components/Icons';

const defaultColumnDefinitions: ColumnDefinition[] = [
  { id: 'number', name: 'Número', key: 'number', type: 'text' },
  { id: 'product', name: 'Producto', key: 'product', type: 'text' },
  { id: 'status', name: 'Estado', key: 'status', type: 'status' },
  { id: 'kommo', name: 'Kommo', key: 'addedToKommoSources', type: 'kommo' },
  { id: 'channel', name: 'Fuente', key: 'channelType', type: 'text' },
  { id: 'countries', name: 'Países', key: 'activeCountries', type: 'array' },
  { id: 'phone', name: 'Celular', key: 'phoneNumberLabel', type: 'text' },
  { id: 'position', name: 'Posición', key: 'positionLabel', type: 'text' },
  { id: 'actions', name: 'Acciones', key: 'actions', type: 'actions' },
];

const App: React.FC = () => {
    // Initialize Supabase safely.
    const [supabase] = useState<SupabaseClient | null>(() => {
        try {
            return SupabaseService.getClient();
        } catch (e) {
            return null;
        }
    });

    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [salesNumbers, setSalesNumbers] = useState<SalesNumber[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [phoneNumberLabels, setPhoneNumberLabels] = useState<PhoneNumberLabel[]>([]);
    const [positionLabels, setPositionLabels] = useState<PositionLabel[]>([]);
    const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

    const [activeTab, setActiveTab] = useState('addNumber');
    const [globalFilterText, setGlobalFilterText] = useState('');
    const [activityLogFilterText, setActivityLogFilterText] = useState('');

    const [columnOrder, setColumnOrder] = useState<ColumnDefinition[]>(() => {
        try {
            const savedOrder = localStorage.getItem(`salesManagerApp_columnOrder`);
            if (savedOrder) {
                const parsedOrder = JSON.parse(savedOrder);
                if (Array.isArray(parsedOrder)) {
                    const validOrder = parsedOrder.filter(pCol => defaultColumnDefinitions.some(defCol => defCol.id === pCol.id));
                    const newColumns = defaultColumnDefinitions.filter(defCol => !validOrder.some(pCol => pCol.id === defCol.id));
                    return [...validOrder, ...newColumns];
                }
            }
        } catch (e) {
            console.error("Error loading column order from localStorage:", e);
        }
        return defaultColumnDefinitions;
    });

    const [newNumberData, setNewNumberData] = useState<Omit<SalesNumber, 'id' | 'created_at' | 'user_id'>>({
        number: '', product: '', status: '', addedToKommoSources: 'No',
        channelType: '', activeCountries: [], phoneNumberLabel: '', positionLabel: '',
    });
    
    const [message, setMessage] = useState('');
    const [editingNumberId, setEditingNumberId] = useState<string | null>(null);
    const [editNumberData, setEditNumberData] = useState<Partial<SalesNumber>>({});
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

    const [showPhoneNumberManagementPanel, setShowPhoneNumberManagementPanel] = useState(false);
    const [showStatusesManagementPanel, setShowStatusesManagementPanel] = useState(false);
    const [showChannelTypesManagementPanel, setShowChannelTypesManagementPanel] = useState(false);
    const [showCountriesManagementPanel, setShowCountriesManagementPanel] = useState(false);
    const [showPositionsManagementPanel, setShowPositionsManagementPanel] = useState(false);
    const [showProductsManagementPanel, setShowProductsManagementPanel] = useState(false);
    const [showNotesPanel, setShowNotesPanel] = useState(false);
    const [currentSalesNumberForNotes, setCurrentSalesNumberForNotes] = useState<SalesNumber | null>(null);

    const showUserMessage = (msg: string, duration = 3000) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), duration);
    };

    // AUTH CHECK
    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const logActivity = useCallback(async (actionType: string, recordType: string, description: string) => {
        if (!supabase || !session?.user.id) return;
        try {
            const { error } = await supabase.from('activityLogs').insert({
                actionType,
                recordType,
                description,
                user_id: session.user.id
            });
            if (error) throw error;
        } catch (e) {
            console.error("Error logging activity:", e);
        }
    }, [supabase, session]);

    const handleSubscriptionChange = <T extends { id: string }>(
        payload: any,
        setter: React.Dispatch<React.SetStateAction<T[]>>,
        sortFn?: (a: T, b: T) => number
    ) => {
        if (payload.eventType === 'INSERT') {
            setter(current => {
                const newState = [...current, payload.new as T];
                if (sortFn) newState.sort(sortFn);
                return newState;
            });
        } else if (payload.eventType === 'UPDATE') {
            setter(current => {
                const newState = current.map(item => item.id === payload.new.id ? payload.new as T : item);
                if (sortFn) newState.sort(sortFn);
                return newState;
            });
        } else if (payload.eventType === 'DELETE') {
            setter(current => current.filter(item => item.id !== payload.old.id));
        }
    };
    
    useEffect(() => {
        if (!supabase || !session?.user.id) return;

        // Subscribe to changes for this user
        const channel = supabase.channel(`user-changes-${session.user.id}`);

        const fetchAndSubscribe = async () => {
            const [
                salesNumbersRes, productsRes, statusesRes, phoneNumberLabelsRes,
                positionLabelsRes, channelTypesRes, activityLogsRes
            ] = await Promise.all([
                supabase.from('salesNumbers').select('*').order('created_at', { ascending: false }),
                supabase.from('products').select('*').order('order', { ascending: true }),
                supabase.from('statuses').select('*').order('order', { ascending: true }),
                supabase.from('phoneNumberLabels').select('*').order('order', { ascending: true }),
                supabase.from('positionLabels').select('*').order('order', { ascending: true }),
                supabase.from('channelTypes').select('*').order('order', { ascending: true }),
                supabase.from('activityLogs').select('*').order('created_at', { ascending: false })
            ]);

            const initErrors = [salesNumbersRes, productsRes, statusesRes].filter(r => r.error);
            if (initErrors.length > 0) {
                console.error("DB Init Errors:", initErrors);
                const msg = initErrors[0].error?.message || "Error desconocido";
                if (msg.includes("relation") && msg.includes("does not exist")) {
                     setMessage("Error Crítico: Las tablas de la base de datos no existen.");
                } else {
                     setMessage(`Error de conexión: ${msg}`);
                }
            }

            if (salesNumbersRes.data) setSalesNumbers(salesNumbersRes.data);
            if (productsRes.data) setProducts(productsRes.data);
            if (statusesRes.data) setStatuses(statusesRes.data);
            if (phoneNumberLabelsRes.data) setPhoneNumberLabels(phoneNumberLabelsRes.data);
            if (positionLabelsRes.data) setPositionLabels(positionLabelsRes.data);
            if (channelTypesRes.data) setChannelTypes(channelTypesRes.data);
            if (activityLogsRes.data) setActivityLogs(activityLogsRes.data);

            channel
                .on('postgres_changes', { event: '*', schema: 'public', table: 'salesNumbers', filter: `user_id=eq.${session.user.id}` }, payload => handleSubscriptionChange<SalesNumber>(payload, setSalesNumbers, (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${session.user.id}` }, payload => handleSubscriptionChange<Product>(payload, setProducts, (a, b) => (a.order ?? 999) - (b.order ?? 999)))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses', filter: `user_id=eq.${session.user.id}` }, payload => handleSubscriptionChange<Status>(payload, setStatuses, (a, b) => (a.order ?? 999) - (b.order ?? 999)))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'phoneNumberLabels', filter: `user_id=eq.${session.user.id}` }, payload => handleSubscriptionChange<PhoneNumberLabel>(payload, setPhoneNumberLabels, (a, b) => (a.order ?? 999) - (b.order ?? 999)))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'positionLabels', filter: `user_id=eq.${session.user.id}` }, payload => handleSubscriptionChange<PositionLabel>(payload, setPositionLabels, (a, b) => (a.order ?? 999) - (b.order ?? 999)))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'channelTypes', filter: `user_id=eq.${session.user.id}` }, payload => handleSubscriptionChange<ChannelType>(payload, setChannelTypes, (a, b) => (a.order ?? 999) - (b.order ?? 999)))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'activityLogs', filter: `user_id=eq.${session.user.id}` }, payload => { if (payload.eventType === 'INSERT') { setActivityLogs(current => [payload.new as ActivityLog, ...current]); }})
                .subscribe();
        };
        
        fetchAndSubscribe();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [supabase, session]);

    // Initialize default data for new users
    useEffect(() => {
        if (!supabase || !session?.user.id || isLoading) return;
        
        const populateInitialData = async () => {
            if (products.length > 0 || statuses.length > 0) return;
            // Check specifically if the user has any products at all
            const { count, error } = await supabase.from('products').select('id', { count: 'exact', head: true });
            
            if (!error && count === 0) {
                 const defaults = {
                    'statuses': ['Activo', 'Libre', 'Revisar', 'Bloqueado', 'Pendiente', 'Reactivado', 'Calentando', 'Abandonado', 'En Revision', 'Programado', 'Por Programar'],
                    'products': ['PRODUCTO A', 'PRODUCTO B', 'PRODUCTO C'],
                    'phoneNumberLabels': ['C1', 'C2', 'C3', 'C4', 'C5'],
                    'positionLabels': ['W1', 'W2', 'W3', 'W4', 'W5'],
                    'channelTypes': ['WPP', 'FB', 'IG', 'TT'],
                };

                for (const [tableName, defaultItems] of Object.entries(defaults)) {
                    const itemsToInsert = defaultItems.map((name, index) => ({ 
                        name, 
                        order: index,
                        user_id: session.user.id
                    }));
                    await supabase.from(tableName).insert(itemsToInsert);
                }
                window.location.reload();
            }
        };
        // Only attempt to populate if we have loaded and have no local data
        if (!isLoading && products.length === 0) {
             populateInitialData();
        }
    }, [session, isLoading, products.length, statuses.length, supabase]);

    const handleColumnOrderChange = useCallback((newOrder: ColumnDefinition[]) => {
        setColumnOrder(newOrder);
        localStorage.setItem(`salesManagerApp_columnOrder`, JSON.stringify(newOrder));
    }, []);

    const handleNewNumberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "activeCountries") {
             setNewNumberData(prev => ({ ...prev, [name]: value as unknown as string[] }));
        } else {
             setNewNumberData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const addSalesNumber = async () => {
        if (!supabase || !session?.user.id) return;
        if (!newNumberData.number.trim() || !newNumberData.status) {
            showUserMessage("Por favor, rellena los campos obligatorios."); return;
        }
        if (salesNumbers.some(s => s.number === newNumberData.number)) {
            showUserMessage("Este número de venta ya existe."); return;
        }

        const { error } = await supabase.from('salesNumbers').insert({ 
            ...newNumberData,
            user_id: session.user.id 
        });
        if (error) {
            showUserMessage(`Error: ${error.message}`);
        } else {
            showUserMessage("Número de venta añadido correctamente.");
            logActivity('created', 'salesNumber', `Número '${newNumberData.number}' añadido.`);
            setNewNumberData({ number: '', product: '', status: '', addedToKommoSources: 'No', channelType: '', activeCountries: [], phoneNumberLabel: '', positionLabel: '' });
        }
    };

    const startEditing = (numberData: SalesNumber) => {
        setEditingNumberId(numberData.id);
        setEditNumberData({ ...numberData });
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "activeCountries") {
            setEditNumberData(prev => ({ ...prev, [name]: value as unknown as string[] }));
        } else {
            setEditNumberData(prev => ({ ...prev, [name]: value }));
        }
    };

    const updateSalesNumber = async () => {
        if (!supabase || !editingNumberId) return;

        const { error } = await supabase.from('salesNumbers').update(editNumberData).match({ id: editingNumberId });
        if (error) {
            showUserMessage(`Error: ${error.message}`);
        } else {
            showUserMessage("Número actualizado.");
            logActivity('updated', 'salesNumber', `Número '${editNumberData.number}' actualizado.`);
            setEditingNumberId(null);
            setEditNumberData({});
        }
    };

    const deleteSalesNumber = async (id: string) => {
        if (!supabase) return;
        const sNumber = salesNumbers.find(n => n.id === id);
        const { error } = await supabase.from('salesNumbers').delete().match({ id });
        if (error) {
            showUserMessage(`Error: ${error.message}`);
        } else {
            showUserMessage("Número eliminado.");
            logActivity('deleted', 'salesNumber', `Número '${sNumber?.number}' eliminado.`);
        }
    };
    
    const addOption = async (collectionName: string, input: string, setInput: (v: string) => void, currentList: any[], type: string) => {
        if (!supabase || !input.trim() || !session?.user.id) return;
        
        const newOrder = currentList.length > 0 ? Math.max(...currentList.map(item => item.order || 0)) + 1 : 0;
        const { error } = await supabase.from(collectionName).insert({ 
            name: input.trim(), 
            order: newOrder,
            user_id: session.user.id
        });
        
        if (error) {
            showUserMessage(`Error: ${error.message}`);
        } else {
            setInput('');
            showUserMessage(`${type} añadido.`);
            logActivity('created', type, `${type} '${input.trim()}' añadido.`);
        }
    };
    
    const deleteOption = async (id: string, collectionName: string, itemName: string, type: string) => {
        if (!supabase) return;
        const { error } = await supabase.from(collectionName).delete().match({ id });
        if (error) {
            showUserMessage(`Error: ${error.message}`);
        } else {
            showUserMessage(`${type} eliminado.`);
            logActivity('deleted', type, `${type} '${itemName}' eliminado.`);
        }
    };

    const handleReorder = async (draggedItemIndex: number, droppedOverItemIndex: number, list: any[], collectionName: string) => {
        if (!supabase) return;
        let _list = [...list];
        const draggedItem = _list[draggedItemIndex];
        _list.splice(draggedItemIndex, 1);
        _list.splice(droppedOverItemIndex, 0, draggedItem);

        const updates = _list.map((item, index) => 
            supabase.from(collectionName).update({ order: index }).match({ id: item.id })
        );
        const results = await Promise.all(updates);
        if (results.some(res => res.error)) {
            showUserMessage("Error al reordenar.");
        } else {
            showUserMessage("Orden actualizado.");
        }
    };
    
    const handleOpenNotesPanel = (salesNumber: SalesNumber) => {
        setCurrentSalesNumberForNotes(salesNumber);
        setShowNotesPanel(true);
    };
    
    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
            setSalesNumbers([]);
            setProducts([]);
            setStatuses([]);
            setPhoneNumberLabels([]);
            setPositionLabels([]);
            setChannelTypes([]);
            setActivityLogs([]);
        }
    };

    const filteredSalesNumbers = useMemo(() => {
        if (!globalFilterText) return salesNumbers;
        const lowerCaseFilter = globalFilterText.toLowerCase();
        return salesNumbers.filter(s =>
            Object.values(s).some(val =>
                String(val).toLowerCase().includes(lowerCaseFilter)
            )
        );
    }, [salesNumbers, globalFilterText]);

    const groupedByStatus = useMemo(() => {
        const groups = statuses.reduce((acc, status) => {
            acc[status.name] = [];
            return acc;
        }, {} as { [key: string]: SalesNumber[] });

        if (!groups['Sin Estado']) groups['Sin Estado'] = [];

        filteredSalesNumbers.forEach(number => {
            if (groups[number.status]) {
                groups[number.status].push(number);
            } else {
                 if(!groups[number.status]) groups[number.status] = [];
                 groups[number.status].push(number);
            }
        });
        return groups;
    }, [filteredSalesNumbers, statuses]);
    
    const filteredActivityLogs = useMemo(() => {
        if (!activityLogFilterText) return activityLogs;
        const lowerCaseFilter = activityLogFilterText.toLowerCase();
        return activityLogs.filter(log => log.description.toLowerCase().includes(lowerCaseFilter));
    }, [activityLogs, activityLogFilterText]);

    // CRITICAL: If Supabase failed to load credentials, show setup screen
    if (!supabase) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8 text-white">
                <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-lg text-center">
                    <h1 className="text-3xl font-bold mb-4 text-red-400">Falta Configuración</h1>
                    <p className="text-gray-300 mb-6">
                        No se pudieron cargar las credenciales de Supabase.
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando...</div>;
    }

    if (!session) {
        return <Auth supabase={supabase} />;
    }
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-8 relative">
            {message && <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg border border-gray-700 animate-fade-in-out z-[70]">{message}</div>}
            
            <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">Gestión de Ventas</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 hidden sm:inline">Usuario: {session.user.email}</span>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30 transition-colors text-sm">
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <div className="flex flex-wrap border-b border-gray-700 mb-6 overflow-x-auto">
                <button onClick={() => setActiveTab('addNumber')} className={`flex items-center py-2 px-4 text-lg font-medium rounded-t-lg transition-colors duration-300 whitespace-nowrap ${activeTab === 'addNumber' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><AddIcon/>Añadir</button>
                <button onClick={() => setActiveTab('dashboard')} className={`flex items-center py-2 px-4 text-lg font-medium rounded-t-lg transition-colors duration-300 whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><DashboardIcon/>Panel</button>
                <button onClick={() => setActiveTab('history')} className={`flex items-center py-2 px-4 text-lg font-medium rounded-t-lg transition-colors duration-300 whitespace-nowrap ${activeTab === 'history' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><HistoryIcon/>Historial</button>
                <button onClick={() => setActiveTab('dataManagement')} className={`flex items-center py-2 px-4 text-lg font-medium rounded-t-lg transition-colors duration-300 whitespace-nowrap ${activeTab === 'dataManagement' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><DataIcon/>Datos</button>
            </div>
            
            {activeTab === 'addNumber' && (
                <section className="bg-gray-800 shadow-xl rounded-xl p-6 mb-8 border border-gray-700 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-semibold text-white mb-6 flex items-center"><AddCircleIcon />Añadir Nuevo Número de Venta</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="number" placeholder="Número de Venta *" value={newNumberData.number} onChange={handleNewNumberChange} className="p-3 border border-gray-600 rounded-lg bg-gray-700 text-white" />
                        <select name="product" value={newNumberData.product} onChange={handleNewNumberChange} className="p-3 border border-gray-600 rounded-lg bg-gray-700 text-white"><option value="">Producto (Opcional)</option>{products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
                        <select name="status" value={newNumberData.status} onChange={handleNewNumberChange} className="p-3 border border-gray-600 rounded-lg bg-gray-700 text-white"><option value="">Selecciona Estado *</option>{statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
                        <select name="addedToKommoSources" value={newNumberData.addedToKommoSources} onChange={handleNewNumberChange} className="p-3 border border-gray-600 rounded-lg bg-gray-700 text-white"><option value="No">Kommo: No</option><option value="Sí">Kommo: Sí</option></select>
                        <select name="channelType" value={newNumberData.channelType} onChange={handleNewNumberChange} className="p-3 border border-gray-600 rounded-lg bg-gray-700 text-white"><option value="">Fuente (Opcional)</option>{channelTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
                        <MultiSelectDropdown label="Países Activos" options={['AR', 'CO', 'VE', 'MX', 'CL'].map(c => ({ value: c, label: c }))} selectedValues={newNumberData.activeCountries} onChange={handleNewNumberChange} />
                        <select name="phoneNumberLabel" value={newNumberData.phoneNumberLabel} onChange={handleNewNumberChange} className="p-3 border border-gray-600 rounded-lg bg-gray-700 text-white"><option value="">Celular (Opcional)</option>{phoneNumberLabels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select>
                        <select name="positionLabel" value={newNumberData.positionLabel} onChange={handleNewNumberChange} className="p-3 border border-gray-600 rounded-lg bg-gray-700 text-white"><option value="">Posición (Opcional)</option>{positionLabels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select>
                        <button onClick={addSalesNumber} className="md:col-span-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">Añadir Número</button>
                    </div>
                </section>
            )}

            {activeTab === 'dashboard' && <Dashboard salesNumbers={salesNumbers} statuses={statuses} selectedStatusFilter={selectedStatusFilter} setSelectedStatusFilter={setSelectedStatusFilter} />}

            {activeTab === 'history' && (
                <section className="bg-gray-800 shadow-xl rounded-xl p-6 mb-8 border border-gray-700">
                    <h2 className="text-2xl font-semibold text-white mb-4">Historial de Actividad</h2>
                    <input type="text" placeholder="Filtrar historial..." value={activityLogFilterText} onChange={(e) => setActivityLogFilterText(e.target.value)} className="w-full p-3 mb-4 border border-gray-600 rounded-lg bg-gray-700 text-white" />
                    <div className="max-h-96 overflow-y-auto">
                        <ul className="space-y-3">{filteredActivityLogs.map(log => (<li key={log.id} className="bg-gray-700 p-4 rounded-md"><p>{log.description}</p><p className="text-gray-400 text-xs text-right">{new Date(log.created_at).toLocaleString()}</p></li>))}</ul>
                    </div>
                </section>
            )}

            {activeTab === 'dataManagement' && (
                <section className="bg-gray-800 shadow-xl rounded-xl p-6 mb-8 border border-gray-700">
                    <h2 className="text-2xl font-semibold text-white mb-4">Datos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <button onClick={() => setShowProductsManagementPanel(true)} className="p-4 bg-gray-700 hover:bg-indigo-600 rounded-lg">Gestionar Productos</button>
                        <button onClick={() => setShowStatusesManagementPanel(true)} className="p-4 bg-gray-700 hover:bg-indigo-600 rounded-lg">Gestionar Estados</button>
                        <button onClick={() => setShowPhoneNumberManagementPanel(true)} className="p-4 bg-gray-700 hover:bg-indigo-600 rounded-lg">Gestionar Celulares</button>
                        <button onClick={() => setShowPositionsManagementPanel(true)} className="p-4 bg-gray-700 hover:bg-indigo-600 rounded-lg">Gestionar Posiciones</button>
                        <button onClick={() => setShowChannelTypesManagementPanel(true)} className="p-4 bg-gray-700 hover:bg-indigo-600 rounded-lg">Gestionar Fuentes</button>
                        <button onClick={() => setShowCountriesManagementPanel(true)} className="p-4 bg-gray-700 hover:bg-indigo-600 rounded-lg">Ver Países</button>
                    </div>
                </section>
            )}
            
            {(activeTab === 'addNumber' || activeTab === 'dashboard') && (
                <>
                    <div className="mb-4"><input type="text" placeholder="Buscar en todos los números..." value={globalFilterText} onChange={(e) => setGlobalFilterText(e.target.value)} className="w-full max-w-lg p-3 border border-gray-600 rounded-lg bg-gray-700 text-white"/></div>
                    {Object.entries(groupedByStatus).map(([status, numbers]) => {
                        return (numbers.length > 0 || !globalFilterText) && (
                            <SalesNumberTable key={status} title={`${status} (${numbers.length})`} numbers={numbers} columns={columnOrder} onColumnOrderChange={handleColumnOrderChange} startEditing={startEditing} deleteSalesNumber={deleteSalesNumber} onOpenNotes={handleOpenNotesPanel} editingNumberId={editingNumberId} editNumberData={editNumberData} handleEditChange={handleEditChange} updateSalesNumber={updateSalesNumber} setEditingNumberId={setEditingNumberId} products={products} statuses={statuses} phoneNumberLabels={phoneNumberLabels} positionLabels={positionLabels} channelTypes={channelTypes} />
                        )
                    })}
                </>
            )}
            
            <GenericSidePanel isOpen={showProductsManagementPanel} onClose={() => setShowProductsManagementPanel(false)} labels={products} addLabel={addOption} deleteLabel={deleteOption} handleReorder={handleReorder} panelTitle="Gestionar Productos" collectionName="products" itemType="producto" />
            <GenericSidePanel isOpen={showStatusesManagementPanel} onClose={() => setShowStatusesManagementPanel(false)} labels={statuses} addLabel={addOption} deleteLabel={deleteOption} handleReorder={handleReorder} panelTitle="Gestionar Estados" collectionName="statuses" itemType="estado" />
            <GenericSidePanel isOpen={showPhoneNumberManagementPanel} onClose={() => setShowPhoneNumberManagementPanel(false)} labels={phoneNumberLabels} addLabel={addOption} deleteLabel={deleteOption} handleReorder={handleReorder} panelTitle="Gestionar Etiquetas de Celular" collectionName="phoneNumberLabels" itemType="etiqueta" />
            <GenericSidePanel isOpen={showPositionsManagementPanel} onClose={() => setShowPositionsManagementPanel(false)} labels={positionLabels} addLabel={addOption} deleteLabel={deleteOption} handleReorder={handleReorder} panelTitle="Gestionar Posiciones" collectionName="positionLabels" itemType="posición" />
            <GenericSidePanel isOpen={showChannelTypesManagementPanel} onClose={() => setShowChannelTypesManagementPanel(false)} labels={channelTypes} addLabel={addOption} deleteLabel={deleteOption} handleReorder={handleReorder} panelTitle="Gestionar Fuentes" collectionName="channelTypes" itemType="fuente" />
            <GenericSidePanel isOpen={showCountriesManagementPanel} onClose={() => setShowCountriesManagementPanel(false)} labels={['AR', 'CO', 'VE', 'MX', 'CL'].map((c, i) => ({ id: `${i}`, name: c, created_at: '' }))} panelTitle="Países Activos (Fijos)" collectionName="countries" itemType="país" isCountriesFixed={true} />
            {session && <NotesPanel isOpen={showNotesPanel} onClose={() => setShowNotesPanel(false)} salesNumber={currentSalesNumberForNotes} logActivity={logActivity} supabase={supabase} />}
        </div>
    );
}

export default App;