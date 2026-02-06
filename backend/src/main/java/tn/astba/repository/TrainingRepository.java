package tn.astba.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.astba.domain.Training;

@Repository
public interface TrainingRepository extends MongoRepository<Training, String> {
}
