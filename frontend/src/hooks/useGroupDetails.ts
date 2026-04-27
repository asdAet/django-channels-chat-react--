import { useCallback, useEffect, useState } from "react";

import { groupController } from "../controllers/GroupController";
import type { UpdateGroupInput } from "../domain/interfaces/IApiService";
import type {
  Group,
  GroupMember,
  PinnedMessage,
} from "../entities/group/types";

/**
 * Описывает результат операции `UseGroupDetails`.
 */
type UseGroupDetailsResult = {
  group: Group | null;
  members: GroupMember[];
  pins: PinnedMessage[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  updateGroup: (data: UpdateGroupInput) => Promise<void>;
  deleteGroup: () => Promise<void>;
  joinGroup: () => Promise<void>;
  leaveGroup: () => Promise<void>;
  kickMember: (userId: number) => Promise<void>;
  banMember: (userId: number, reason?: string) => Promise<void>;
  muteMember: (userId: number, durationSeconds?: number) => Promise<void>;
  unmuteMember: (userId: number) => Promise<void>;
  pinMessage: (messageId: number) => Promise<void>;
  unpinMessage: (messageId: number) => Promise<void>;
};

/**
 * Хук useGroupDetails управляет состоянием и побочными эффектами текущего сценария.
 * @param roomId Идентификатор комнаты.
 * @returns Публичное состояние хука и его обработчики.
 */
export function useGroupDetails(roomId: string): UseGroupDetailsResult {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pins, setPins] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [g, m, p] = await Promise.all([
        groupController.getGroupDetails(roomId),
        groupController.getGroupMembers(roomId),
        groupController.getPinnedMessages(roomId),
      ]);
      setGroup(g);
      setMembers(m.items);
      setPins(p);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Ошибка загрузки";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateGroupCb = useCallback(
    async (data: UpdateGroupInput) => {
      const updated = await groupController.updateGroup(roomId, data);
      setGroup(updated);
    },
    [roomId],
  );

  const deleteGroupCb = useCallback(async () => {
    await groupController.deleteGroup(roomId);
  }, [roomId]);

  const joinGroupCb = useCallback(async () => {
    await groupController.joinGroup(roomId);
    void reload();
  }, [roomId, reload]);

  const leaveGroupCb = useCallback(async () => {
    await groupController.leaveGroup(roomId);
    void reload();
  }, [roomId, reload]);

  const kickMemberCb = useCallback(
    async (userId: number) => {
      await groupController.kickMember(roomId, userId);
      void reload();
    },
    [roomId, reload],
  );

  const banMemberCb = useCallback(
    async (userId: number, reason?: string) => {
      await groupController.banMember(roomId, userId, reason);
      void reload();
    },
    [roomId, reload],
  );

  const muteMemberCb = useCallback(
    async (userId: number, durationSeconds?: number) => {
      await groupController.muteMember(roomId, userId, durationSeconds);
      void reload();
    },
    [roomId, reload],
  );

  const unmuteMemberCb = useCallback(
    async (userId: number) => {
      await groupController.unmuteMember(roomId, userId);
      void reload();
    },
    [roomId, reload],
  );

  const pinMessageCb = useCallback(
    async (messageId: number) => {
      await groupController.pinMessage(roomId, messageId);
      const updated = await groupController.getPinnedMessages(roomId);
      setPins(updated);
    },
    [roomId],
  );

  const unpinMessageCb = useCallback(
    async (messageId: number) => {
      await groupController.unpinMessage(roomId, messageId);
      const updated = await groupController.getPinnedMessages(roomId);
      setPins(updated);
    },
    [roomId],
  );

  return {
    group,
    members,
    pins,
    loading,
    error,
    reload,
    updateGroup: updateGroupCb,
    deleteGroup: deleteGroupCb,
    joinGroup: joinGroupCb,
    leaveGroup: leaveGroupCb,
    kickMember: kickMemberCb,
    banMember: banMemberCb,
    muteMember: muteMemberCb,
    unmuteMember: unmuteMemberCb,
    pinMessage: pinMessageCb,
    unpinMessage: unpinMessageCb,
  };
}
