
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Plus, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  text: string;
  status: "todo" | "doing" | "done";
}

const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [newTaskText, setNewTaskText] = useState("");
  const { toast } = useToast();

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        status: "todo",
      };
      setTasks([...tasks, newTask]);
      setNewTaskText("");
      toast({
        title: "Task added",
        description: "New task has been added to To Do",
        duration: 3000,
      });
    }
  };

  const moveTask = (taskId: string, direction: "forward" | "backward") => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          if (direction === "forward") {
            if (task.status === "todo") return { ...task, status: "doing" };
            if (task.status === "doing") return { ...task, status: "done" };
          } else if (direction === "backward") {
            if (task.status === "doing") return { ...task, status: "todo" };
            if (task.status === "done") return { ...task, status: "doing" };
          }
        }
        return task;
      })
    );
  };
  
  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast({
      title: "Task deleted",
      description: "Task has been removed",
      duration: 3000,
    });
  };

  const todoTasks = tasks.filter((task) => task.status === "todo");
  const doingTasks = tasks.filter((task) => task.status === "doing");
  const doneTasks = tasks.filter((task) => task.status === "done");

  return (
    <div>
    <h2 className="font-semibold text-xl mb-4">Task Management</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

    <Card className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
        <div className="bg-purple-100 px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-lg text-purple-800">To Do</h3>
        </div>
        <CardContent className="p-4">
        <div className="flex space-x-2 mb-4">
            <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="New task..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
            onKeyDown={(e) => {
                if (e.key === 'Enter') addTask();
            }}
            />
            <Button 
            onClick={addTask} 
            className="bg-purple-600 hover:bg-purple-700 transition-colors"
            >
            <Plus className="h-5 w-5" />
            </Button>
        </div>
        
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {todoTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-white border border-gray-200 rounded-md p-3 flex justify-between items-center shadow-sm hover:border-purple-300 transition-colors"
                >
                  <p className="text-gray-700">{task.text}</p>
                  <div className="flex items-center space-x-1">
                    <Button 
                      onClick={() => deleteTask(task.id)} 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => moveTask(task.id, "forward")} 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-400 hover:text-purple-500 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {todoTasks.length === 0 && (
                <div className="py-8 text-center border border-dashed border-gray-200 rounded-md">
                  <p className="text-gray-400">No tasks to do</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Doing Column */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <div className="bg-blue-100 px-4 py-3 border-b border-gray-200">
            <h3 className="font-medium text-lg text-blue-800">Doing</h3>
          </div>
          <CardContent className="p-4">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {doingTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-white border border-gray-200 rounded-md p-3 flex justify-between items-center shadow-sm hover:border-blue-300 transition-colors"
                >
                  <p className="text-gray-700">{task.text}</p>
                  <div className="flex items-center space-x-1">
                    <Button 
                      onClick={() => deleteTask(task.id)} 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => moveTask(task.id, "backward")} 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => moveTask(task.id, "forward")} 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {doingTasks.length === 0 && (
                <div className="py-8 text-center border border-dashed border-gray-200 rounded-md">
                  <p className="text-gray-400">No tasks in progress</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Done Column */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <div className="bg-green-100 px-4 py-3 border-b border-gray-200">
            <h3 className="font-medium text-lg text-green-800">Done</h3>
          </div>
          <CardContent className="p-4">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {doneTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={cn(
                    "bg-white border border-gray-200 rounded-md p-3 flex justify-between items-center shadow-sm hover:border-green-300 transition-colors",
                    "group"
                  )}
                >
                  <p className="text-gray-500 line-through opacity-70 group-hover:text-gray-700 transition-colors">{task.text}</p>
                  <div className="flex items-center space-x-1">
                    <Button 
                      onClick={() => deleteTask(task.id)} 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => moveTask(task.id, "backward")} 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-400 hover:text-green-500 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {doneTasks.length === 0 && (
                <div className="py-8 text-center border border-dashed border-gray-200 rounded-md">
                  <p className="text-gray-400">No completed tasks</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskBoard;
