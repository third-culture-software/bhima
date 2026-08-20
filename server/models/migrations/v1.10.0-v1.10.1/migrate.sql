/*
 * @author: mbayopanda
 * @date: 2020-02-29
 * @description: remove ambiguity with default 1 for avg_consumption if there is no stock consumed
 */
UPDATE inventory SET avg_consumption = 0
WHERE avg_consumption = 1;
