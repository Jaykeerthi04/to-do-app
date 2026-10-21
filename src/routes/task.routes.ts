import { Router } from "express";
import {
  createTask, deleteTask, getTask, listTasks, taskMeta, toggleTask, updateTask,
} from "../controllers/task.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(requireAuth); // every task route needs a logged-in user

router.get("/meta", asyncHandler(taskMeta)); // must come before "/:id"
router.route("/").get(asyncHandler(listTasks)).post(asyncHandler(createTask));
router
  .route("/:id")
  .get(asyncHandler(getTask))
  .patch(asyncHandler(updateTask))
  .delete(asyncHandler(deleteTask));
router.patch("/:id/toggle", asyncHandler(toggleTask));
export default router;
