import MainLayout from "@/components/layout/MainLayout";
import TaskBoard from "@/components/dashboard/TaskBoard";

const Tasks = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground mt-2">
            Organize your job search tasks with a kanban board
          </p>
        </div>
        <TaskBoard />
      </div>
    </MainLayout>
  );
};

export default Tasks;