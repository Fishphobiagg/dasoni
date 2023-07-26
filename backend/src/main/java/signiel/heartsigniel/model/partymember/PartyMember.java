package signiel.heartsigniel.model.partymember;

import lombok.Data;
import lombok.NoArgsConstructor;
import signiel.heartsigniel.model.member.Member;
import signiel.heartsigniel.model.party.Party;


import javax.persistence.*;

@Entity
@Data
@NoArgsConstructor
public class PartyMember {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne
        @JoinColumn(name = "party_id")
        private Party party;

        @ManyToOne
        @JoinColumn(name = "member_id")
        private Member member;

        private boolean isPartyLeader;
        private boolean isSpecialUser;

}
