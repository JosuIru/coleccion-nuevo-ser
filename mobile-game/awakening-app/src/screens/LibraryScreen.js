/**
 * LIBRARY SCREEN - Biblioteca integrada
 * Catálogo de libros y sincronización de progreso de lectura
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  ScrollView,
  Modal,
  Dimensions,
  Alert
} from 'react-native';
import useGameStore from '../stores/gameStore';
import { COLORS } from '../config/constants';
import logger from '../utils/logger';

const { width } = Dimensions.get('window');

// Mock de catálogo de libros (en una app real vendría de la API)
const BOOKS_CATALOG = [
  {
    id: 'codigo-despertar',
    title: 'El Código del Despertar',
    author: 'Colección Nuevo Ser',
    category: 'Filosofía',
    chapters: 14,
    color: '#8b5cf6',
    icon: '🌟',
    description: 'Un viaje hacia la consciencia expandida y el despertar colectivo.',
    readProgress: 35 // Mock: 35% leído
  },
  {
    id: 'manifiesto',
    title: 'Manifiesto del Nuevo Ser',
    author: 'Colección Nuevo Ser',
    category: 'Manifiesto',
    chapters: 12,
    color: '#ef4444',
    icon: '🔥',
    description: 'Principios fundamentales para la transformación personal y social.',
    readProgress: 80
  },
  {
    id: 'manual-practico',
    title: 'Manual Práctico',
    author: 'Colección Nuevo Ser',
    category: 'Práctica',
    chapters: 20,
    color: '#10b981',
    icon: '🛠️',
    description: 'Herramientas y ejercicios para el cambio consciente.',
    readProgress: 10
  },
  {
    id: 'guia-acciones',
    title: 'Guía de Acciones Transformadoras',
    author: 'Colección Nuevo Ser',
    category: 'Acción',
    chapters: 15,
    color: '#f59e0b',
    icon: '⚡',
    description: 'Acciones concretas para generar impacto en tu comunidad.',
    readProgress: 0
  },
  {
    id: 'toolkit-transicion',
    title: 'Toolkit de Transición',
    author: 'Colección Nuevo Ser',
    category: 'Recursos',
    chapters: 18,
    color: '#06b6d4',
    icon: '🧰',
    description: 'Recursos y estrategias para la transición hacia nuevos paradigmas.',
    readProgress: 0
  },
  {
    id: 'practicas-radicales',
    title: 'Prácticas Radicales',
    author: 'Colección Nuevo Ser',
    category: 'Meditación',
    chapters: 10,
    color: '#a855f7',
    icon: '🧘',
    description: 'Meditaciones y prácticas para la transformación profunda.',
    readProgress: 55
  },
  {
    id: 'manual-transicion',
    title: 'Manual de Transición',
    author: 'Colección Nuevo Ser',
    category: 'Transición',
    chapters: 16,
    color: '#ec4899',
    icon: '🌈',
    description: 'Guía paso a paso para la transición personal y colectiva.',
    readProgress: 20
  },
  {
    id: 'tierra-que-despierta',
    title: 'La Tierra que Despierta',
    author: 'Colección Nuevo Ser',
    category: 'Visión',
    chapters: 22,
    color: '#059669',
    icon: '🌍',
    description: 'Visión de un planeta consciente y en armonía.',
    readProgress: 0
  }
];

const LibraryScreen = ({ navigation }) => {
  // ═══════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════

  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [books, setBooks] = useState(BOOKS_CATALOG);

  // Zustand store
  const { user, syncing } = useGameStore();

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ═══════════════════════════════════════════════════════════
  // EFECTOS
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // FILTRADO Y ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════

  const filteredBooks = filterCategory === 'all'
    ? books
    : books.filter(book => book.category === filterCategory);

  const categories = ['all', ...new Set(books.map(b => b.category))];

  const totalBooks = books.length;
  const booksInProgress = books.filter(b => b.readProgress > 0 && b.readProgress < 100).length;
  const booksCompleted = books.filter(b => b.readProgress === 100).length;
  const totalReadProgress = Math.round(
    books.reduce((sum, book) => sum + book.readProgress, 0) / totalBooks
  );

  // ═══════════════════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════════════════

  const onBookPress = (book) => {
    setSelectedBook(book);
    setShowBookModal(true);
  };

  const onMarkAsRead = (bookId) => {
    setBooks(books.map(book =>
      book.id === bookId ? { ...book, readProgress: 100 } : book
    ));

    Alert.alert('¡Libro completado!', `Has marcado "${selectedBook.title}" como leído.`);
    setShowBookModal(false);
  };

  const onOpenBook = (book) => {
    // En una app real, esto abriría el lector integrado o navegaría a la app web
    Alert.alert(
      'Abrir libro',
      `Por ahora, esta función te redirigirá a la aplicación web para leer "${book.title}".`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Abrir',
          onPress: () => {
            setShowBookModal(false);
            // Aquí iría la navegación a WebView o deep link a la app web
            logger.info("`Abriendo libro: ${book.id}`", "");
          }
        }
      ]
    );
  };

  const onSyncProgress = () => {
    Alert.alert(
      'Sincronizar progreso',
      'Esta función sincronizará tu progreso de lectura con la aplicación web.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sincronizar',
          onPress: () => {
            // Simular sincronización
            Alert.alert('Sincronizado', 'Tu progreso de lectura ha sido sincronizado.');
          }
        }
      ]
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER BOOK CARD
  // ═══════════════════════════════════════════════════════════

  const renderBookCard = ({ item: book, index }) => {
    const progressWidth = `${book.readProgress}%`;
    const statusText = book.readProgress === 0
      ? 'No iniciado'
      : book.readProgress === 100
      ? 'Completado'
      : `${book.readProgress}% leído`;

    return (
      <Animated.View
        style={[
          styles.bookCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => onBookPress(book)}
          activeOpacity={0.8}
        >
          {/* Cover visual */}
          <View style={[styles.bookCover, { backgroundColor: book.color }]}>
            <Text style={styles.bookCoverIcon}>{book.icon}</Text>
          </View>

          {/* Info */}
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={styles.bookAuthor} numberOfLines={1}>
              {book.author}
            </Text>
            <View style={styles.bookMeta}>
              <Text style={styles.bookCategory}>{book.category}</Text>
              <Text style={styles.bookChapters}>• {book.chapters} caps.</Text>
            </View>

            {/* Barra de progreso */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressWidth,
                      backgroundColor: book.readProgress === 100
                        ? COLORS.accent.success
                        : COLORS.accent.primary
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{statusText}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Biblioteca</Text>
          <Text style={styles.headerSubtitle}>
            {totalBooks} libros • {totalReadProgress}% completado
          </Text>
        </View>

        <TouchableOpacity
          style={styles.syncButton}
          onPress={onSyncProgress}
        >
          <Text style={styles.syncIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* ESTADÍSTICAS DE LECTURA */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{booksCompleted}</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{booksInProgress}</Text>
          <Text style={styles.statLabel}>En progreso</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalBooks - booksInProgress - booksCompleted}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>

      {/* FILTROS POR CATEGORÍA */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                filterCategory === category && styles.filterButtonActive
              ]}
              onPress={() => setFilterCategory(category)}
            >
              <Text style={[
                styles.filterButtonText,
                filterCategory === category && styles.filterButtonTextActive
              ]}>
                {category === 'all' ? 'Todos' : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LISTA DE LIBROS */}
      <FlatList
        data={filteredBooks}
        renderItem={renderBookCard}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />

      {/* MODAL DE DETALLE DEL LIBRO */}
      <Modal
        visible={showBookModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBookModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedBook && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowBookModal(false)}
                  >
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Cover grande */}
                  <View style={[
                    styles.modalBookCover,
                    { backgroundColor: selectedBook.color }
                  ]}>
                    <Text style={styles.modalBookCoverIcon}>{selectedBook.icon}</Text>
                  </View>

                  {/* Información */}
                  <Text style={styles.modalBookTitle}>{selectedBook.title}</Text>
                  <Text style={styles.modalBookAuthor}>{selectedBook.author}</Text>

                  <View style={styles.modalBookMeta}>
                    <View style={styles.modalMetaItem}>
                      <Text style={styles.modalMetaLabel}>Categoría</Text>
                      <Text style={styles.modalMetaValue}>{selectedBook.category}</Text>
                    </View>
                    <View style={styles.modalMetaItem}>
                      <Text style={styles.modalMetaLabel}>Capítulos</Text>
                      <Text style={styles.modalMetaValue}>{selectedBook.chapters}</Text>
                    </View>
                  </View>

                  <Text style={styles.modalBookDescription}>
                    {selectedBook.description}
                  </Text>

                  {/* Progreso */}
                  <View style={styles.modalProgressSection}>
                    <Text style={styles.modalProgressLabel}>Progreso de lectura</Text>
                    <View style={styles.modalProgressBarContainer}>
                      <View style={styles.modalProgressBarBg}>
                        <View
                          style={[
                            styles.modalProgressBarFill,
                            {
                              width: `${selectedBook.readProgress}%`,
                              backgroundColor: selectedBook.readProgress === 100
                                ? COLORS.accent.success
                                : COLORS.accent.primary
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.modalProgressValue}>
                        {selectedBook.readProgress}%
                      </Text>
                    </View>
                  </View>

                  {/* Acciones */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={() => onOpenBook(selectedBook)}
                    >
                      <Text style={styles.primaryActionButtonText}>
                        {selectedBook.readProgress > 0 ? 'Continuar leyendo' : 'Comenzar a leer'}
                      </Text>
                    </TouchableOpacity>

                    {selectedBook.readProgress < 100 && (
                      <TouchableOpacity
                        style={styles.secondaryActionButton}
                        onPress={() => onMarkAsRead(selectedBook.id)}
                      >
                        <Text style={styles.secondaryActionButtonText}>
                          Marcar como leído
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent.primary + '20'
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg.elevated,
    justifyContent: 'center',
    alignItems: 'center'
  },

  backIcon: {
    fontSize: 24,
    color: COLORS.text.primary
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center'
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4
  },

  headerSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary
  },

  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },

  syncIcon: {
    fontSize: 20
  },

  // Barra de estadísticas
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: COLORS.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent.primary + '10'
  },

  statItem: {
    alignItems: 'center'
  },

  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accent.primary,
    marginBottom: 4
  },

  statLabel: {
    fontSize: 11,
    color: COLORS.text.secondary
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.text.dim + '40'
  },

  // Filtros
  filtersContainer: {
    backgroundColor: COLORS.bg.secondary,
    paddingVertical: 12,
    marginBottom: 8
  },

  filtersContent: {
    paddingHorizontal: 16,
    gap: 8
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.bg.elevated,
    marginRight: 8
  },

  filterButtonActive: {
    backgroundColor: COLORS.accent.primary
  },

  filterButtonText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '600'
  },

  filterButtonTextActive: {
    color: COLORS.text.primary
  },

  // Lista
  listContent: {
    padding: 12
  },

  columnWrapper: {
    gap: 12,
    marginBottom: 12
  },

  // Book Card
  bookCard: {
    flex: 1,
    maxWidth: (width - 36) / 2,
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '20'
  },

  bookCover: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center'
  },

  bookCoverIcon: {
    fontSize: 60
  },

  bookInfo: {
    padding: 12
  },

  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
    minHeight: 36
  },

  bookAuthor: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginBottom: 8
  },

  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },

  bookCategory: {
    fontSize: 10,
    color: COLORS.accent.primary,
    fontWeight: '600'
  },

  bookChapters: {
    fontSize: 10,
    color: COLORS.text.dim,
    marginLeft: 4
  },

  progressBarContainer: {
    marginTop: 4
  },

  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 2
  },

  progressText: {
    fontSize: 10,
    color: COLORS.text.dim,
    textAlign: 'center'
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end'
  },

  modalContent: {
    backgroundColor: COLORS.bg.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%'
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg.elevated,
    justifyContent: 'center',
    alignItems: 'center'
  },

  closeIcon: {
    fontSize: 20,
    color: COLORS.text.primary
  },

  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },

  modalBookCover: {
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },

  modalBookCoverIcon: {
    fontSize: 100
  },

  modalBookTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center'
  },

  modalBookAuthor: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 20,
    textAlign: 'center'
  },

  modalBookMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 20
  },

  modalMetaItem: {
    alignItems: 'center'
  },

  modalMetaLabel: {
    fontSize: 12,
    color: COLORS.text.dim,
    marginBottom: 4
  },

  modalMetaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary
  },

  modalBookDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24
  },

  modalProgressSection: {
    marginBottom: 24
  },

  modalProgressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12
  },

  modalProgressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },

  modalProgressBarBg: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.bg.primary,
    borderRadius: 6,
    overflow: 'hidden'
  },

  modalProgressBarFill: {
    height: '100%',
    borderRadius: 6
  },

  modalProgressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    minWidth: 45,
    textAlign: 'right'
  },

  modalActions: {
    gap: 12
  },

  primaryActionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.accent.primary,
    alignItems: 'center'
  },

  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary
  },

  secondaryActionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.bg.elevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent.primary + '40'
  },

  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary
  }
});

export default LibraryScreen;
