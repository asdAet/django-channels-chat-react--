import { useCallback, useEffect, useState } from "react";

import { rolesController } from "../../controllers/RolesController";
import type { Role } from "../../entities/role/types";
import { Skeleton } from "../../shared/ui";
import styles from "../../styles/admin/RolesManager.module.css";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  roomId: string;
};

/**
 * Skeleton списка ролей. Шапка менеджера остается на экране, чтобы блок
 * администрирования не схлопывался на время загрузки прав.
 */
function RolesSkeleton() {
  return (
    <div className={styles.rolesSkeleton} aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div className={styles.roleItem} key={index}>
          <Skeleton variant="circle" width={12} height={12} />
          <Skeleton variant="text" width={index % 2 === 0 ? "38%" : "52%"} />
          <Skeleton width={54} height={20} radius={4} />
        </div>
      ))}
    </div>
  );
}

/**
 * React-компонент RolesManager отвечает за отрисовку и обработку UI-сценария.
 */
export function RolesManager({ roomId }: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#8ae6ff");
  const [creating, setCreating] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await rolesController.getRoomRoles(roomId);
      setRoles(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleCreate = useCallback(async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await rolesController.createRoomRole(roomId, {
        name: trimmed,
        color: newColor,
      });
      setNewName("");
      setShowCreate(false);
      void reload();
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  }, [roomId, newName, newColor, reload]);

  const handleDelete = useCallback(
    async (roleId: number) => {
      try {
        await rolesController.deleteRoomRole(roomId, roleId);
        void reload();
      } catch {
        // silent
      }
    },
    [roomId, reload],
  );

  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <span className={styles.title}>Роли</span>
          <button type="button" className={styles.addBtn} disabled>
            + Роль
          </button>
        </div>
        <RolesSkeleton />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>Роли</span>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setShowCreate(!showCreate)}
        >
          + Роль
        </button>
      </div>

      {roles.map((role) => (
        <div key={role.id} className={styles.roleItem}>
          <span
            className={styles.roleColor}
            style={{ background: role.color }}
          />
          <span className={styles.roleName}>{role.name}</span>
          {role.isDefault && (
            <span className={styles.roleDefault}>default</span>
          )}
          <div className={styles.roleActions}>
            <button
              type="button"
              className={[
                styles.roleActionBtn,
                styles.roleActionBtnDanger,
              ].join(" ")}
              onClick={() => handleDelete(role.id)}
              disabled={role.isDefault}
              aria-label={`Удалить роль ${role.name}`}
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {roles.length === 0 && <div className={styles.centered}>Нет ролей</div>}

      {showCreate && (
        <div className={styles.createForm}>
          <input
            className={styles.createInput}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Название роли"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <input
            type="color"
            className={styles.createColorInput}
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
          />
          <button
            type="button"
            className={styles.createSubmitBtn}
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
          >
            Создать
          </button>
        </div>
      )}
    </div>
  );
}
