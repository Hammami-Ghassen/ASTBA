package tn.astba.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.astba.domain.AttendanceStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionAttendanceInfo {
    private String studentId;
    private String studentFirstName;
    private String studentLastName;
    private AttendanceStatus status;
}
