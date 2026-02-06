package tn.astba.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Level {

    private int levelNumber; // 1..4

    private String title; // e.g. "Niveau 1"

    private List<Session> sessions; // 6 sessions per level
}
