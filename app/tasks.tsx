import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addTask, deleteTask, getAllTasks, updateTask } from '@/lib/data/local/tasks';
import { Task } from '@/types/task';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');

  const loadTasks = () => {
    const allTasks = getAllTasks();
    setTasks(allTasks);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAddTask = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setIsModalVisible(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setIsModalVisible(true);
  };

  const handleSaveTask = () => {
    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    if (editingTask) {
      // Update existing task
      const updated = updateTask(editingTask.id, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
      });
      if (updated) {
        loadTasks();
      }
    } else {
      // Add new task
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        completed: false,
      };
      addTask(newTask);
      loadTasks();
    }

    setIsModalVisible(false);
    setTaskTitle('');
    setTaskDescription('');
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTask(taskId);
          loadTasks();
        },
      },
    ]);
  };

  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask(taskId, { completed: !task.completed });
      loadTasks();
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setTaskTitle('');
    setTaskDescription('');
    setEditingTask(null);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.pageTitle}>
            Tasks
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.tasksContainer}>
          {tasks.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>No tasks yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Tap the + button to add your first task
              </ThemedText>
            </ThemedView>
          ) : (
            tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                colors={colors}
              />
            ))
          )}
        </ThemedView>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colorScheme === 'dark' ? '#0a7ea4' : colors.tint },
          pressed && styles.fabPressed,
        ]}
        onPress={handleAddTask}>
        <IconSymbol name="plus" size={28} color="#fff" />
      </Pressable>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}>
        <Pressable style={styles.modalOverlayPressable} onPress={handleCancel}>
          <KeyboardAvoidingView
            style={styles.modalContentWrapper}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <ThemedView style={styles.modalContent}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  {editingTask ? 'Edit Task' : 'New Task'}
                </ThemedText>

                <ScrollView
                  style={styles.modalFormScroll}
                  contentContainerStyle={styles.modalFormContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Title *</ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.icon,
                        },
                      ]}
                      value={taskTitle}
                      onChangeText={setTaskTitle}
                      placeholder="Enter task title"
                      placeholderTextColor={colors.icon}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Description</ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.icon,
                        },
                      ]}
                      value={taskDescription}
                      onChangeText={setTaskDescription}
                      placeholder="Enter task description (optional)"
                      placeholderTextColor={colors.icon}
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </ScrollView>

                <View style={[styles.modalButtons, { borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.cancelButton,
                      { borderColor: colors.icon },
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleCancel}>
                    <ThemedText style={{ color: colors.text }}>Cancel</ThemedText>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.saveButton,
                      { backgroundColor: colorScheme === 'dark' ? '#0a7ea4' : colors.tint },
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleSaveTask}>
                    <ThemedText style={{ color: '#fff' }}>Save</ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  colors: typeof Colors.light;
}

function TaskItem({ task, onToggleComplete, onEdit, onDelete, colors }: TaskItemProps) {
  // Create a semi-transparent border color based on icon color
  const borderColor = colors.icon === '#687076' // light mode icon color
    ? 'rgba(104, 112, 118, 0.3)'
    : 'rgba(155, 161, 166, 0.3)'; // dark mode icon color
  
  return (
    <ThemedView style={[styles.taskItem, { borderColor }]}>
      <Pressable
        style={styles.taskContent}
        onPress={() => onToggleComplete(task.id)}>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: task.completed ? colors.tint : 'transparent',
              borderColor: colors.tint,
            },
          ]}>
          {task.completed && <IconSymbol name="checkmark" size={16} color="#fff" />}
        </View>
        <View style={styles.taskTextContainer}>
          <ThemedText
            style={[
              styles.taskTitle,
              task.completed && styles.taskCompleted,
            ]}>
            {task.title}
          </ThemedText>
          {task.description && (
            <ThemedText
              style={[
                styles.taskDescription,
                task.completed && styles.taskCompleted,
              ]}>
              {task.description}
            </ThemedText>
          )}
        </View>
      </Pressable>
      <View style={styles.taskActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => onEdit(task)}>
          <IconSymbol name="pencil" size={18} color={colors.tint} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => onDelete(task.id)}>
          <IconSymbol name="trash" size={18} color="#ff4444" />
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
    gap: 8,
  },
  pageTitle: {
    marginBottom: 4,
  },
  tasksContainer: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.6,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTextContainer: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  fabPressed: {
    opacity: 0.8,
  },
  modalOverlayPressable: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContentWrapper: {
    width: '100%',
    maxHeight: '85%',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 24,
    minHeight: 300,
  },
  modalTitle: {
    marginBottom: 24,
  },
  modalFormScroll: {
    minHeight: 200,
  },
  modalFormContent: {
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    minHeight: 50,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  buttonPressed: {
    opacity: 0.7,
  },
});

